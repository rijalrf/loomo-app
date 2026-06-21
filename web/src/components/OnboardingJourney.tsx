'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Building2, Users, ArrowRight, ArrowLeft, Plus, Trash2, Check, Sparkles, Code, Palette, Megaphone, HelpCircle, Briefcase, Smile } from 'lucide-react';

interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string;
}

interface Workspace {
  id: string;
  name: string;
  role: string;
  isOwner: boolean;
}

interface OnboardingJourneyProps {
  user: User;
  onComplete: (workspace: Workspace) => void;
}

const DEPARTMENTS = [
  { id: 'engineering', label: 'Engineering & Product', icon: <Code className="text-[var(--primary)]" size={20} /> },
  { id: 'design', label: 'Design & Creative', icon: <Palette className="text-[var(--secondary)]" size={20} /> },
  { id: 'marketing', label: 'Marketing & Sales', icon: <Megaphone className="text-pink-500" size={20} /> },
  { id: 'operations', label: 'Operations & HR', icon: <Briefcase className="text-emerald-500" size={20} /> },
  { id: 'personal', label: 'Personal & Individual', icon: <Smile className="text-amber-500" size={20} /> },
  { id: 'other', label: 'Other / Custom', icon: <HelpCircle className="text-slate-400" size={20} /> }
];

export default function OnboardingJourney({ user, onComplete }: OnboardingJourneyProps) {
  const [step, setStep] = useState(1);
  const [workspaceName, setWorkspaceName] = useState(`${user.displayName.split(' ')[0]}'s Workspace`);
  const [workspaceDesc, setWorkspaceDesc] = useState('');
  const [selectedDept, setSelectedDept] = useState('engineering');
  const [emails, setEmails] = useState<string[]>(['']);
  const [submitting, setSubmitting] = useState(false);

  const addEmailField = () => {
    if (emails.length >= 10) {
      toast.error('You can invite up to 10 members during onboarding.');
      return;
    }
    setEmails([...emails, '']);
  };

  const removeEmailField = (index: number) => {
    const newEmails = [...emails];
    newEmails.splice(index, 1);
    setEmails(newEmails.length === 0 ? [''] : newEmails);
  };

  const updateEmail = (index: number, val: string) => {
    const newEmails = [...emails];
    newEmails[index] = val;
    setEmails(newEmails);
  };

  const handleSubmit = async () => {
    if (!workspaceName.trim()) {
      toast.error('Please enter a workspace name');
      return;
    }
    
    setSubmitting(true);
    try {
      const validEmails = emails.filter(e => e.trim() !== '' && e.includes('@'));
      
      const res = await fetch('/api/workspace/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: workspaceName,
          description: workspaceDesc,
          department: DEPARTMENTS.find(d => d.id === selectedDept)?.label || selectedDept,
          members: validEmails
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Workspace created successfully!');
        onComplete(data.workspace);
      } else {
        toast.error(data.error || 'Failed to create workspace');
      }
    } catch (err) {
      toast.error('Network error. Failed to complete onboarding.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-overlay)] text-slate-200 flex flex-col justify-between p-6 relative overflow-hidden font-sans">
      {/* Decorative Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[var(--primary)]/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-[var(--secondary)]/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <header className="flex items-center justify-between max-w-4xl w-full mx-auto z-10 pt-4">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Loomo Logo" className="w-8 h-8 object-contain" />
          <span className="text-2xl font-black tracking-tighter text-white">Loomo</span>
        </div>
        <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 rounded-full px-3 py-1.5 text-xs text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Logged in as {user.displayName}</span>
        </div>
      </header>

      {/* Main Form Body */}
      <main className="max-w-2xl w-full mx-auto z-10 flex-1 flex flex-col justify-center my-12">
        <div className="glass-panel bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-xl p-8 md:p-12 relative">
          
          {/* Step Indicator */}
          <div className="flex items-center gap-2 mb-8">
            <span className={`w-8 h-1.5 rounded-full transition-all duration-300 ${step === 1 ? 'bg-[var(--primary)]' : 'bg-slate-800'}`}></span>
            <span className={`w-8 h-1.5 rounded-full transition-all duration-300 ${step === 2 ? 'bg-[var(--primary)]' : 'bg-slate-800'}`}></span>
          </div>

          {step === 1 ? (
            /* Step 1: Workspace Info */
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div>
                <div className="flex items-center gap-2 text-[var(--primary)] mb-2">
                  <Sparkles size={18} />
                  <span className="text-xs font-black uppercase tracking-widest">Welcome to Loomo</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-none mb-3">
                  Let&apos;s set up your space.
                </h1>
                <p className="text-slate-400 text-sm md:text-base font-medium max-w-md">
                  Workspaces keep your screenshots and screen recordings organized and private to your team.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Workspace Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Marketing, Personal projects..."
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    className="w-full bg-slate-950/40 border border-slate-800 focus:border-[var(--primary)] text-white text-base py-3 px-4 rounded-lg outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Workspace Description</label>
                  <input
                    type="text"
                    placeholder="Briefly describe the purpose of this workspace (optional)..."
                    value={workspaceDesc}
                    onChange={(e) => setWorkspaceDesc(e.target.value)}
                    className="w-full bg-slate-950/40 border border-slate-800 focus:border-[var(--primary)] text-white text-base py-3 px-4 rounded-lg outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Department / Team</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {DEPARTMENTS.map((dept) => (
                      <button
                        key={dept.id}
                        type="button"
                        onClick={() => setSelectedDept(dept.id)}
                        className={`flex items-center gap-3 p-4 rounded-lg border text-left transition-all cursor-pointer ${
                          selectedDept === dept.id
                            ? 'bg-[var(--primary)]/10 border-[var(--primary)] text-white'
                            : 'bg-slate-950/25 border-slate-800 hover:border-slate-700/80 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className={`p-2 rounded-lg transition-all ${
                          selectedDept === dept.id ? 'bg-[var(--primary)]/20' : 'bg-slate-900/60'
                        }`}>
                          {dept.icon}
                        </div>
                        <span className="text-sm font-bold">{dept.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-800/60">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!workspaceName.trim()}
                  className="btn-primary py-3 px-8 text-sm font-bold disabled:opacity-40 disabled:pointer-events-none"
                >
                  <span>Continue</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ) : (
            /* Step 2: Invite Members */
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div>
                <div className="flex items-center gap-2 text-[var(--secondary)] mb-2">
                  <Users size={18} />
                  <span className="text-xs font-black uppercase tracking-widest">Step 2 of 2</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-none mb-3">
                  Invite your team.
                </h1>
                <p className="text-slate-400 text-sm md:text-base font-medium max-w-md">
                  Collaborate instantly. Loomo acts as a secure proxy to save captures right to your Google Drive.
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Team Member Emails (Optional)</label>
                
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                  {emails.map((email, idx) => (
                    <div key={idx} className="flex gap-2 items-center animate-in fade-in slide-in-from-top-1 duration-150">
                      <input
                        type="email"
                        placeholder="colleague@company.com"
                        value={email}
                        onChange={(e) => updateEmail(idx, e.target.value)}
                        className="flex-1 bg-slate-950/40 border border-slate-800 focus:border-[var(--primary)] text-white text-sm py-2.5 px-4 rounded-lg outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => removeEmailField(idx)}
                        className="p-2.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 border border-slate-800 rounded-lg transition-all cursor-pointer"
                        title="Remove member"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addEmailField}
                  className="flex items-center gap-2 text-xs font-bold text-[var(--primary)] hover:text-[var(--primary-hover)] transition-all cursor-pointer py-1.5 px-3 rounded-lg border border-[var(--primary)]/20 bg-[var(--primary)]/5 hover:bg-[var(--primary)]/15"
                >
                  <Plus size={14} />
                  <span>Add another email</span>
                </button>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-800/60">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-secondary py-3 px-6 text-sm font-bold"
                >
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="btn-primary py-3 px-8 rounded-lg text-sm font-bold"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <span>Finish Setup</span>
                      <Check size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-slate-600 text-xs py-4 max-w-4xl w-full mx-auto">
        &copy; {new Date().getFullYear()} Loomo Inc. All rights reserved.
      </footer>
    </div>
  );
}
