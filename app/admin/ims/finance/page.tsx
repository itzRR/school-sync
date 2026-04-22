"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { LogOut, DollarSign, FileText, TrendingDown, TrendingUp, Plus, Trash2, X, Search, BarChart3, Menu, Download, CreditCard, Receipt, List, Calendar, CalendarDays, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { useRouter } from 'next/navigation';

import {
  getImsPayments, createImsPayment, deleteImsPayment,
  getImsInvoices, createImsInvoice, updateImsInvoice, deleteImsInvoice,
  getImsExpenses, createImsExpense, deleteImsExpense,
} from "@/lib/ims-data"
import { getCurrentUser, signOut } from "@/lib/auth"
import type { ImsPayment, ImsInvoice, ImsExpense, ImsInvoiceItem, Profile } from '@/types';
import SriLankaCalendar from "@/components/ims/SriLankaCalendar"
import StaffAttendance from "@/components/ims/StaffAttendance"
import ProfileSection from "@/components/ims/ProfileSection"

const EXPENSE_CATS = ['Utilities', 'Rent', 'Salaries', 'Marketing', 'Equipment', 'Maintenance', 'Other'] as const;
const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Online'] as const;

export default function FinanceDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('payments');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isHead = currentUser?.role === 'admin' || currentUser?.role === 'super_admin' || currentUser?.access_level >= 2;
  const [payments, setPayments] = useState<ImsPayment[]>([]);
  const [invoices, setInvoices] = useState<ImsInvoice[]>([]);
  const [expenses, setExpenses] = useState<ImsExpense[]>([]);
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(true);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  const emptyPayment: {
    student_name: string; student_id: string; course_id: string; amount: number;
    method: "Cash" | "Bank Transfer" | "Online"; date: string; invoice_id: string | null; notes: string;
  } = { student_name: '', student_id: '', course_id: '', amount: 0, method: 'Cash' as const, date: format(new Date(), 'yyyy-MM-dd'), invoice_id: null, notes: '' };
  const [paymentForm, setPaymentForm] = useState(emptyPayment);

  const emptyInvoice = { student_name: '', student_id: '', course_name: '', items: [{ description: '', amount: 0 }] as ImsInvoiceItem[], due_date: '', status: 'Unpaid' as const };
  const [invoiceForm, setInvoiceForm] = useState(emptyInvoice);

  const emptyExpense = { category: 'Utilities' as const, amount: 0, date: format(new Date(), 'yyyy-MM-dd'), notes: '' };
  const [expenseForm, setExpenseForm] = useState(emptyExpense);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [p, inv, exp, u] = await Promise.all([
        getImsPayments(), getImsInvoices(), getImsExpenses(), getCurrentUser(),
      ]);
      setPayments(p); setInvoices(inv); setExpenses(exp); setCurrentUser(u);
    } catch (e: any) { toast.error(e.message) }
    finally { setLoading(false) }
  }, []);

  useEffect(() => { loadData() }, [loadData]);

  useEffect(() => { const t = setTimeout(() => setShowLoadingAnimation(false), 2000); return () => clearTimeout(t); }, []);

  const handleLogout = async () => {
    await signOut();
    router.push('/auth/login');
  };

  const handleDeletePayment = async (id: string, invoiceId?: string | null) => {
    if (!isHead) return toast.error('Only Department Heads can delete payments');
    if (!confirm('Delete this payment?')) return;
    try {
      await deleteImsPayment(id);
      if (invoiceId) {
        const inv = invoices.find(i => i.id === invoiceId);
        if (inv) {
          const remainingPayments = payments.filter(p => p.invoice_id === invoiceId && p.id !== id);
          const paidAmount = remainingPayments.reduce((sum, p) => sum + p.amount, 0);
          const updated = await updateImsInvoice(invoiceId, { status: paidAmount >= inv.total ? 'Paid' : (paidAmount > 0 ? 'Partial' : 'Unpaid') });
          setInvoices(prev => prev.map(i => i.id === invoiceId ? updated : i));
        }
      }
      setPayments(prev => prev.filter(p => p.id !== id));
      toast.success('Payment deleted!');
    } catch (e: any) { toast.error(e.message) }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!isHead) return toast.error('Only Department Heads can delete invoices');
    if (!confirm('Delete this invoice?')) return;
    try {
      await deleteImsInvoice(id);
      setInvoices(prev => prev.filter(i => i.id !== id));
      toast.success('Invoice deleted!');
    } catch (e: any) { toast.error(e.message) }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!isHead) return toast.error('Only Department Heads can delete expenses');
    if (!confirm('Delete this expense?')) return;
    try {
      await deleteImsExpense(id);
      setExpenses(prev => prev.filter(e => e.id !== id));
      toast.success('Expense deleted!');
    } catch (e: any) { toast.error(e.message) }
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.student_name.trim() || paymentForm.amount <= 0) return toast.error('Name and amount required');
    try {
      const created = await createImsPayment({ ...paymentForm, created_by: currentUser?.id });
      setPayments(prev => [created, ...prev]);
      if (paymentForm.invoice_id) {
        const inv = invoices.find(i => i.id === paymentForm.invoice_id);
        if (inv) {
          const currentPayments = payments.filter(p => p.invoice_id === paymentForm.invoice_id).reduce((s, p) => s + p.amount, 0);
          const newTotal = currentPayments + paymentForm.amount;
          const updated = await updateImsInvoice(paymentForm.invoice_id, { status: newTotal >= inv.total ? 'Paid' : 'Partial' });
          setInvoices(prev => prev.map(i => i.id === paymentForm.invoice_id ? updated : i));
        }
      }
      toast.success('Payment recorded!'); setShowPaymentModal(false); setPaymentForm(emptyPayment);
    } catch (e: any) { toast.error(e.message) }
  };

  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceForm.student_name.trim()) return toast.error('Student name required');
    const total = invoiceForm.items.reduce((s, i) => s + i.amount, 0);
    try {
      const created = await createImsInvoice({ ...invoiceForm, total, generated_by: currentUser?.id });
      setInvoices(prev => [created, ...prev]);
      toast.success('Invoice created!'); setShowInvoiceModal(false);
      setInvoiceForm(emptyInvoice);
    } catch (e: any) { toast.error(e.message) }
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (expenseForm.amount <= 0) return toast.error('Amount required');
    try {
      const created = await createImsExpense({ ...expenseForm, created_by: currentUser?.id });
      setExpenses(prev => [created, ...prev]);
      toast.success('Expense logged!'); setShowExpenseModal(false); setExpenseForm(emptyExpense);
    } catch (e: any) { toast.error(e.message) }
  };

  const generateInvoicePDF = (inv: ImsInvoice) => {
    const doc2 = new jsPDF();
    doc2.setFillColor(15, 23, 42); doc2.rect(0, 0, 210, 297, 'F');
    doc2.setDrawColor(59, 130, 246); doc2.setLineWidth(2); doc2.rect(10, 10, 190, 277);
    doc2.setTextColor(59, 130, 246); doc2.setFontSize(20); doc2.setFont('helvetica', 'bold');
    doc2.text('CADD Centre', 20, 30);
    doc2.setTextColor(255, 255, 255); doc2.setFontSize(14); doc2.text('INVOICE', 170, 30, { align: 'right' });
    doc2.setFontSize(10); doc2.setFont('helvetica', 'normal'); doc2.setTextColor(150, 150, 150);
    doc2.text(`Invoice #: ${inv.id.slice(0, 8).toUpperCase()}`, 20, 45);
    doc2.text(`Date: ${format(new Date(inv.generated_at), 'dd/MM/yyyy')}`, 20, 52);
    if (inv.due_date) doc2.text(`Due: ${inv.due_date}`, 20, 59);
    doc2.setTextColor(255, 255, 255); doc2.setFontSize(12); doc2.setFont('helvetica', 'bold');
    doc2.text('Bill To:', 20, 75); doc2.setFont('helvetica', 'normal');
    doc2.text(inv.student_name, 20, 83); doc2.text(`ID: ${inv.student_id || 'N/A'}`, 20, 90);
    doc2.text(`Course: ${inv.course_name || 'N/A'}`, 20, 97);
    doc2.setFillColor(30, 41, 59); doc2.rect(15, 110, 180, 8, 'F');
    doc2.setTextColor(150, 200, 255); doc2.setFontSize(10); doc2.setFont('helvetica', 'bold');
    doc2.text('Description', 20, 116); doc2.text('Amount (LKR)', 160, 116, { align: 'right' });
    let y = 128;
    inv.items.forEach(item => {
      doc2.setTextColor(200, 200, 200); doc2.setFont('helvetica', 'normal');
      doc2.text(item.description, 20, y); doc2.text(item.amount.toLocaleString(), 160, y, { align: 'right' });
      doc2.setDrawColor(50, 60, 80); doc2.line(15, y + 3, 195, y + 3);
      y += 12;
    });
    doc2.setDrawColor(59, 130, 246); doc2.setLineWidth(0.5); doc2.line(15, y + 2, 195, y + 2);
    doc2.setTextColor(59, 130, 246); doc2.setFontSize(13); doc2.setFont('helvetica', 'bold');
    doc2.text(`TOTAL: LKR ${inv.total.toLocaleString()}`, 160, y + 12, { align: 'right' });
    const statusColors: Record<string, number[]> = { Paid: [34, 197, 94], Unpaid: [239, 68, 68], Partial: [234, 179, 8] };
    const sc = statusColors[inv.status] || [150, 150, 150];
    doc2.setFillColor(sc[0], sc[1], sc[2]); doc2.roundedRect(20, y + 22, 30, 8, 2, 2, 'F');
    doc2.setTextColor(255, 255, 255); doc2.setFontSize(9);
    doc2.text(inv.status, 35, y + 27, { align: 'center' });
    doc2.setTextColor(100, 100, 100); doc2.setFontSize(8); doc2.setFont('helvetica', 'normal');
    doc2.text('Thank you for choosing CADD Centre', 105, 275, { align: 'center' });
    doc2.save(`Invoice_${inv.student_name.replace(/ /g, '_')}.pdf`);
    toast.success('Invoice PDF downloaded!');
  };

  const generateReceiptPDF = (pay: ImsPayment) => {
    const doc2 = new jsPDF();
    doc2.setFillColor(15, 23, 42); doc2.rect(0, 0, 210, 297, 'F');
    doc2.setTextColor(34, 197, 94); doc2.setFontSize(22); doc2.setFont('helvetica', 'bold');
    doc2.text('CADD Centre', 105, 30, { align: 'center' });
    doc2.setTextColor(255, 255, 255); doc2.setFontSize(16); doc2.text('PAYMENT RECEIPT', 105, 45, { align: 'center' });
    doc2.setDrawColor(34, 197, 94); doc2.line(30, 50, 180, 50);
    const rows = [['Receipt ID:', pay.id.slice(0, 8).toUpperCase()], ['Date:', pay.date], ['Student:', pay.student_name], ['Student ID:', pay.student_id || 'N/A'], ['Amount:', `LKR ${pay.amount.toLocaleString()}`], ['Method:', pay.method], ['Notes:', pay.notes || 'N/A']];
    let y = 65;
    rows.forEach(([label, val]) => {
      doc2.setTextColor(150, 150, 150); doc2.setFontSize(10); doc2.setFont('helvetica', 'bold'); doc2.text(label, 30, y);
      doc2.setTextColor(label === 'Amount:' ? 34 : 200, label === 'Amount:' ? 197 : 200, label === 'Amount:' ? 94 : 200);
      doc2.setFont('helvetica', 'normal'); doc2.text(val, 90, y);
      y += 12;
    });
    doc2.setFillColor(34, 197, 94); doc2.roundedRect(70, y + 10, 70, 14, 3, 3, 'F');
    doc2.setTextColor(255, 255, 255); doc2.setFontSize(12); doc2.setFont('helvetica', 'bold');
    doc2.text('PAYMENT CONFIRMED', 105, y + 19, { align: 'center' });
    doc2.setTextColor(100, 100, 100); doc2.setFontSize(9); doc2.setFont('helvetica', 'normal');
    doc2.text('CADD Centre - Official Receipt', 105, 270, { align: 'center' });
    doc2.save(`Receipt_${pay.student_name.replace(/ /g, '_')}_${pay.date}.pdf`);
    toast.success('Receipt downloaded!');
  };

  const exportFinance = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(payments.map(p => ({ Student: p.student_name, Amount: p.amount, Method: p.method, Date: p.date, Notes: p.notes }))), 'Payments');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expenses.map(e => ({ Category: e.category, Amount: e.amount, Date: e.date, Notes: e.notes }))), 'Expenses');
    XLSX.writeFile(wb, `CADD_Finance_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    toast.success('Finance report exported!');
  };

  const totalIncome = payments.reduce((s, p) => s + p.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = totalIncome - totalExpenses;

  const navSections = [
    {
      label: '💰 Finance',
      items: [
        { id: 'payments',  label: 'Payments',    icon: CreditCard,   badge: 0 },
        { id: 'invoices',  label: 'Invoices',    icon: FileText,     badge: 0 },
        { id: 'expenses',  label: 'Expenses',    icon: TrendingDown, badge: 0 },
        { id: 'reports',   label: 'P&L Report',  icon: BarChart3,    badge: 0 },
      ]
    },
    {
      label: '📋 My Work',
      items: [
        { id: 'attendance', label: 'My Attendance', icon: Clock,    badge: 0 },
        { id: 'profile',   label: 'My Profile', icon: User,         badge: 0 },
      ]
    },
    {
      label: '🗂 Tools',
      items: [
        { id: 'calendar',  label: 'Calendar',    icon: CalendarDays, badge: 0 },
      ]
    },
  ];

  const filteredPayments = payments.filter(p =>
    !search || p.student_name.toLowerCase().includes(search.toLowerCase()) ||
    (p.student_id && p.student_id.toLowerCase().includes(search.toLowerCase()))
  );
  
  const filteredInvoices = invoices.filter(i =>
    !search || i.student_name.toLowerCase().includes(search.toLowerCase()) ||
    (i.student_id && i.student_id.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center deep-blue-bg">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen deep-blue-bg">
      <AnimatePresence>
        {showLoadingAnimation && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-900/90 backdrop-blur-md">
            <motion.div animate={{ rotate: 360, scale: [1, 1.15, 1] }} transition={{ duration: 3, repeat: Infinity }}
              className="w-24 h-24 bg-gradient-to-r from-blue-500 to-violet-500 rounded-full flex items-center justify-center mb-6">
              <DollarSign className="w-12 h-12 text-white" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-2">CADD Centre - Finance</h2>
            <div className="w-64 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <motion.div className="h-full bg-gradient-to-r from-blue-500 to-violet-400"
                initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 3 }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.header initial={{ y: -100 }} animate={{ y: 0 }} className="dark-glass-strong p-4 md:p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-violet-500 rounded-xl flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-blue-400">Finance Dashboard</h1>
            <p className="text-white/50 text-sm hidden md:block">CADD Centre - {currentUser?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/ims')} className="text-white/70 hover:text-white px-3 py-2 border border-white/20 rounded-xl">Back to Admin</button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 glass-button text-white rounded-xl border border-white/20 hover:bg-red-500/30">
            <LogOut className="w-4 h-4" /> Logout
          </motion.button>
        </div>
      </motion.header>

      <div className="flex">
        {/* Sidebar */}
        <motion.aside initial={{ x: -100 }} animate={{ x: 0 }}
          className={`dark-glass-strong h-screen sticky top-0 z-40 w-60 flex flex-col ${mobileMenuOpen ? 'fixed inset-y-0 left-0 z-50' : 'hidden md:flex'}`}>
          {mobileMenuOpen && <div className="flex justify-end p-3 md:hidden"><button onClick={() => setMobileMenuOpen(false)} className="text-white"><X size={20} /></button></div>}

          {/* Profile Card */}
          <div className="px-4 pt-5 pb-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {currentUser?.name?.charAt(0).toUpperCase() || 'F'}
              </div>
              <div className="min-w-0">
                <p className="text-blue-300 text-xs font-semibold">Finance Dept.</p>
                <p className="text-white/40 text-[10px] mt-0.5">CCL Taskflow</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="bg-white/5 rounded-lg p-2 text-center border border-white/10">
                <p className="font-bold text-sm text-green-400">LKR {(totalIncome/1000).toFixed(0)}k</p>
                <p className="text-white/40 text-[10px]">Income</p>
              </div>
              <div className="bg-white/5 rounded-lg p-2 text-center border border-white/10">
                <p className="font-bold text-sm text-red-400">LKR {(totalExpenses/1000).toFixed(0)}k</p>
                <p className="text-white/40 text-[10px]">Expense</p>
              </div>
            </div>
          </div>

          {/* Nav Sections */}
          <div className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
            {navSections.map(section => (
              <div key={section.label}>
                <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest px-2 mb-1.5">{section.label}</p>
                <div className="space-y-0.5">
                  {section.items.map(item => (
                    <motion.button
                      key={item.id}
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-sm relative ${
                        activeTab === item.id
                          ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-500/20'
                          : (item as any).urgent
                            ? 'text-yellow-300 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20'
                            : 'text-white/70 hover:text-white hover:bg-white/8'
                      }`}
                    >
                      {activeTab === item.id && (
                        <motion.div layoutId="fin-active-pill" className="absolute left-0 top-0 bottom-0 w-0.5 bg-white rounded-full" />
                      )}
                      <item.icon className={`w-4 h-4 flex-shrink-0 ${activeTab === item.id ? 'text-white' : (item as any).urgent ? 'text-yellow-300' : 'text-white/50'}`} />
                      <span className="flex-1 text-left font-medium">{item.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.aside>

        <main className="flex-1 p-4 md:p-6 min-h-[calc(100vh-80px)] overflow-auto space-y-5 bg-[#0e1628]">

          {/* ── PAYMENTS ── */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex-1 min-w-[180px] relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search payments…"
                    className="w-full pl-9 pr-3 py-2 dark-glass-card text-white placeholder-white/40 rounded-xl border border-white/10 focus:outline-none focus:border-blue-500" />
                </div>
                <motion.button whileHover={{ scale: 1.05 }} onClick={exportFinance}
                  className="flex items-center gap-2 px-4 py-2 glass-button text-white rounded-xl border border-white/20">
                  <Download className="w-4 h-4" /> Export
                </motion.button>
                <motion.button whileHover={{ scale: 1.05 }} onClick={() => setShowPaymentModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-violet-600 text-white rounded-xl font-semibold">
                  <Plus className="w-4 h-4" /> Record Payment
                </motion.button>
              </div>

              <div className="dark-glass-card rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-white/80">
                    <thead className="bg-white/5">
                      <tr>{['Date','Student','Course','Amount','Method','Actions'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-white/50 text-xs uppercase">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {filteredPayments.map(p => (
                        <tr key={p.id} className="border-t border-white/5 hover:bg-white/5">
                          <td className="px-4 py-3">{p.date}</td>
                          <td className="px-4 py-3 font-semibold text-white">{p.student_name} <span className="text-white/40 font-normal block text-xs">{p.student_id}</span></td>
                          <td className="px-4 py-3 text-white/60">{p.course_id}</td>
                          <td className="px-4 py-3 font-bold text-green-400">LKR {p.amount.toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-white/10 border border-white/10 text-white/80">{p.method}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button onClick={() => generateReceiptPDF(p)} className="p-1.5 hover:text-green-400 text-white/40"><Receipt className="w-4 h-4" /></button>
                              {isHead && <button onClick={() => handleDeletePayment(p.id, p.invoice_id)} className="p-1.5 hover:text-red-400 text-white/40"><Trash2 className="w-4 h-4" /></button>}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredPayments.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-white/30">No payments found</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── INVOICES ── */}
          {activeTab === 'invoices' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Invoices</h2>
                <motion.button whileHover={{ scale: 1.05 }} onClick={() => setShowInvoiceModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-violet-600 text-white rounded-xl font-semibold">
                  <Plus className="w-4 h-4" /> New Invoice
                </motion.button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredInvoices.map(inv => (
                  <div key={inv.id} className="dark-glass-card p-5 rounded-2xl border border-white/10 space-y-3 relative overflow-hidden group hover:border-blue-500/50 transition-colors">
                    <div className={`absolute top-0 right-0 px-3 py-1 text-xs font-bold rounded-bl-xl ${inv.status === 'Paid' ? 'bg-green-500/20 text-green-400' : inv.status === 'Unpaid' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {inv.status}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">{inv.student_name}</h3>
                      <p className="text-white/40 text-xs">ID: {inv.student_id} | Course: {inv.course_name}</p>
                    </div>
                    <div className="text-3xl font-black text-blue-400">LKR {inv.total.toLocaleString()}</div>
                    <div className="text-xs text-white/60 space-y-1">
                      <div className="flex justify-between border-b border-white/5 pb-1"><span>Issued:</span> <span>{format(new Date(inv.generated_at), 'dd MMM yyyy')}</span></div>
                      <div className="flex justify-between"><span>Due:</span> <span className={new Date(inv.due_date || '') < new Date() && inv.status !== 'Paid' ? 'text-red-400 font-bold' : ''}>{inv.due_date}</span></div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button onClick={() => generateInvoicePDF(inv)} className="flex-1 py-1.5 glass-button text-xs font-semibold rounded-lg border border-white/20 flex items-center justify-center gap-1">
                        <Download className="w-3 h-3" /> PDF
                      </button>
                      {inv.status !== 'Paid' && (
                        <button onClick={() => { setPaymentForm({ ...emptyPayment, student_name: inv.student_name, student_id: inv.student_id || '', course_id: inv.course_name || '', invoice_id: inv.id, amount: inv.total }); setShowPaymentModal(true); }}
                          className="flex-1 py-1.5 bg-green-500/20 text-green-400 hover:bg-green-500/30 text-xs font-bold rounded-lg border border-green-500/20 transition-colors">
                          Pay Now
                        </button>
                      )}
                      {isHead && (
                        <button onClick={() => handleDeleteInvoice(inv.id)} className="px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg border border-red-500/20">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {filteredInvoices.length === 0 && <div className="col-span-full text-center py-12 text-white/30">No invoices generated yet.</div>}
              </div>
            </div>
          )}

          {/* ── EXPENSES ── */}
          {activeTab === 'expenses' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Expenses</h2>
                <motion.button whileHover={{ scale: 1.05 }} onClick={() => setShowExpenseModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-semibold">
                  <Plus className="w-4 h-4" /> Log Expense
                </motion.button>
              </div>

              <div className="dark-glass-card rounded-2xl overflow-hidden">
                <table className="w-full text-sm text-white/80">
                  <thead className="bg-white/5">
                    <tr>{['Date','Category','Amount','Notes','Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-white/50 text-xs uppercase">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {expenses.map(e => (
                      <tr key={e.id} className="border-t border-white/5 hover:bg-white/5">
                        <td className="px-4 py-3 text-white/70">{e.date}</td>
                        <td className="px-4 py-3 font-semibold text-white">
                          <span className="px-2 py-1 rounded-md bg-white/10 text-xs border border-white/10">{e.category}</span>
                        </td>
                        <td className="px-4 py-3 font-bold text-red-400">LKR {e.amount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-white/50">{e.notes}</td>
                        <td className="px-4 py-3">
                          {isHead && <button onClick={() => handleDeleteExpense(e.id)} className="p-1.5 hover:text-red-400 text-white/40"><Trash2 className="w-4 h-4" /></button>}
                        </td>
                      </tr>
                    ))}
                    {expenses.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-white/30">No expenses logged yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── REPORTS ── */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">Profit & Loss Report</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="dark-glass-card p-6 rounded-2xl border border-green-500/20 bg-green-500/5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-500/20 rounded-lg text-green-400"><TrendingUp className="w-5 h-5" /></div>
                    <p className="text-white/60 font-semibold">Total Revenue</p>
                  </div>
                  <h3 className="text-3xl font-black text-green-400">LKR {totalIncome.toLocaleString()}</h3>
                </div>
                <div className="dark-glass-card p-6 rounded-2xl border border-red-500/20 bg-red-500/5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-red-500/20 rounded-lg text-red-400"><TrendingDown className="w-5 h-5" /></div>
                    <p className="text-white/60 font-semibold">Total Expenses</p>
                  </div>
                  <h3 className="text-3xl font-black text-red-400">LKR {totalExpenses.toLocaleString()}</h3>
                </div>
                <div className={`dark-glass-card p-6 rounded-2xl border ${netProfit >= 0 ? 'border-blue-500/20 bg-blue-500/5' : 'border-orange-500/20 bg-orange-500/5'}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${netProfit >= 0 ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}><DollarSign className="w-5 h-5" /></div>
                    <p className="text-white/60 font-semibold">Net Profit</p>
                  </div>
                  <h3 className={`text-3xl font-black ${netProfit >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>LKR {netProfit.toLocaleString()}</h3>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'calendar' && <SriLankaCalendar accentColor="blue" />}
          {activeTab === 'attendance' && (
            <div className="dark-glass-card p-6 rounded-2xl border border-white/10">
              <h2 className="text-xl font-bold text-white mb-4">My Attendance</h2>
              <p className="text-white/50 mb-4">Your personal attendance records.</p>
              <StaffAttendance />
            </div>
          )}
          {activeTab === 'profile' && currentUser && (
            <ProfileSection userData={currentUser} />
          )}

        </main>
      </div>

      {/* ── PAYMENT MODAL ── */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="dark-glass-strong rounded-2xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-white">Record Payment</h2>
                <button onClick={() => setShowPaymentModal(false)} className="text-white/50 hover:text-white"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSavePayment} className="space-y-3">
                {[['Student Name *', 'student_name', 'text', true], ['Student ID', 'student_id', 'text', false], ['Course ID', 'course_id', 'text', false]].map(([label, key, type, req]) => (
                  <div key={key as string}>
                    <label className="block text-white/70 text-sm mb-1">{label as string}</label>
                    <input type={type as string} required={req as boolean} value={(paymentForm as any)[key as string]}
                      onChange={e => setPaymentForm(p => ({ ...p, [key as string]: e.target.value }))}
                      className="w-full dark-glass-card text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-blue-500" />
                  </div>
                ))}
                <div>
                  <label className="block text-white/70 text-sm mb-1">Amount (LKR) *</label>
                  <input type="number" required value={paymentForm.amount} onChange={e => setPaymentForm(p => ({ ...p, amount: Number(e.target.value) }))}
                    className="w-full dark-glass-card text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-1">Method</label>
                  <select value={paymentForm.method} onChange={e => setPaymentForm(p => ({ ...p, method: e.target.value as 'Cash' | 'Bank Transfer' | 'Online' }))}
                    className="w-full dark-glass-card text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-blue-500">
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                {[['Date', 'date', 'date'], ['Notes', 'notes', 'text']].map(([label, key, type]) => (
                  <div key={key}>
                    <label className="block text-white/70 text-sm mb-1">{label}</label>
                    <input type={type} value={(paymentForm as any)[key]} onChange={e => setPaymentForm(p => ({ ...p, [key]: e.target.value }))}
                      className="w-full dark-glass-card text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-blue-500" />
                  </div>
                ))}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowPaymentModal(false)} className="flex-1 py-2 glass-button text-white rounded-xl border border-white/20">Cancel</button>
                  <button type="submit" className="flex-1 py-2 bg-gradient-to-r from-blue-500 to-violet-600 text-white rounded-xl font-semibold">Save</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── INVOICE MODAL ── */}
      <AnimatePresence>
        {showInvoiceModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="dark-glass-strong rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-white">New Invoice</h2>
                <button onClick={() => setShowInvoiceModal(false)} className="text-white/50 hover:text-white"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSaveInvoice} className="space-y-3">
                {[['Student Name *', 'student_name', true], ['Student ID', 'student_id', false], ['Course Name', 'course_name', false]].map(([label, key, req]) => (
                  <div key={key as string}>
                    <label className="block text-white/70 text-sm mb-1">{label as string}</label>
                    <input required={req as boolean} value={(invoiceForm as any)[key as string]}
                      onChange={e => setInvoiceForm(p => ({ ...p, [key as string]: e.target.value }))}
                      className="w-full dark-glass-card text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-blue-500" />
                  </div>
                ))}
                <div>
                  <label className="block text-white/70 text-sm mb-1">Due Date</label>
                  <input type="date" value={invoiceForm.due_date} onChange={e => setInvoiceForm(p => ({ ...p, due_date: e.target.value }))}
                    className="w-full dark-glass-card text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-white/70 text-sm">Line Items</label>
                    <button type="button" onClick={() => setInvoiceForm(p => ({ ...p, items: [...p.items, { description: '', amount: 0 }] }))}
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"><Plus className="w-3 h-3" /> Add Item</button>
                  </div>
                  {invoiceForm.items.map((item, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input placeholder="Description" value={item.description}
                        onChange={e => { const items = [...invoiceForm.items]; items[i].description = e.target.value; setInvoiceForm(p => ({ ...p, items })); }}
                        className="flex-1 dark-glass-card text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-blue-500 text-sm" />
                      <input type="number" placeholder="LKR" value={item.amount}
                        onChange={e => { const items = [...invoiceForm.items]; items[i].amount = Number(e.target.value); setInvoiceForm(p => ({ ...p, items })); }}
                        className="w-28 dark-glass-card text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-blue-500 text-sm" />
                      {invoiceForm.items.length > 1 && (
                        <button type="button" onClick={() => setInvoiceForm(p => ({ ...p, items: p.items.filter((_, j) => j !== i) }))}
                          className="text-white/30 hover:text-red-400"><X className="w-4 h-4" /></button>
                      )}
                    </div>
                  ))}
                  <div className="text-right text-sm font-bold text-blue-400">
                    Total: LKR {invoiceForm.items.reduce((s, i) => s + i.amount, 0).toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowInvoiceModal(false)} className="flex-1 py-2 glass-button text-white rounded-xl border border-white/20">Cancel</button>
                  <button type="submit" className="flex-1 py-2 bg-gradient-to-r from-blue-500 to-violet-600 text-white rounded-xl font-semibold">Create Invoice</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── EXPENSE MODAL ── */}
      <AnimatePresence>
        {showExpenseModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="dark-glass-strong rounded-2xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-white">Log Expense</h2>
                <button onClick={() => setShowExpenseModal(false)} className="text-white/50 hover:text-white"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSaveExpense} className="space-y-3">
                <div>
                  <label className="block text-white/70 text-sm mb-1">Category</label>
                  <select value={expenseForm.category} onChange={e => setExpenseForm(p => ({ ...p, category: e.target.value as any }))}
                    className="w-full dark-glass-card text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-blue-500">
                    {EXPENSE_CATS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-1">Amount (LKR) *</label>
                  <input type="number" required value={expenseForm.amount} onChange={e => setExpenseForm(p => ({ ...p, amount: Number(e.target.value) }))}
                    className="w-full dark-glass-card text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-1">Date</label>
                  <input type="date" value={expenseForm.date} onChange={e => setExpenseForm(p => ({ ...p, date: e.target.value }))}
                    className="w-full dark-glass-card text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-1">Notes</label>
                  <textarea value={expenseForm.notes} onChange={e => setExpenseForm(p => ({ ...p, notes: e.target.value }))} rows={2}
                    className="w-full dark-glass-card text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-blue-500 resize-none" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowExpenseModal(false)} className="flex-1 py-2 glass-button text-white rounded-xl border border-white/20">Cancel</button>
                  <button type="submit" className="flex-1 py-2 bg-gradient-to-r from-blue-500 to-violet-600 text-white rounded-xl font-semibold">Save</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
