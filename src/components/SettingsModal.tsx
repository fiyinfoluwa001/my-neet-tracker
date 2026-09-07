import { useState } from 'react';
import emailjs from '@emailjs/browser';
import { EmailSettings } from '../types';
import { isOverdue, isDueToday, todayStr } from '../utils/spacedRepetition';
import type { Problem } from '../types';

interface Props {
  settings: EmailSettings;
  problems: Problem[];
  onSave: (settings: EmailSettings) => void;
  onClose: () => void;
}

type SetupStep = 1 | 2 | 3 | 4;

export function SettingsModal({ settings, problems, onSave, onClose }: Props) {
  const [form, setForm]       = useState<EmailSettings>(settings);
  const [step, setStep]       = useState<SetupStep>(1);
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');
  const [testError, setTestError]   = useState('');

  const set = (key: keyof EmailSettings, value: string | boolean) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleSave = () => {
    onSave(form);
    onClose();
  };

  const handleTestEmail = async () => {
    const { recipientEmail, serviceId, templateId, publicKey } = form;
    if (!recipientEmail || !serviceId || !templateId || !publicKey) {
      setTestError('Fill in all fields before sending a test.');
      setTestStatus('error');
      return;
    }
    setTestStatus('sending');
    setTestError('');

    const overdueList  = problems.filter(isOverdue);
    const dueTodayList = problems.filter(isDueToday);
    const allDue = [...overdueList, ...dueTodayList];

    const problemsText = allDue.length > 0
      ? allDue.map(p => `• ${p.name} (${p.difficulty}, Stage ${p.stage}/6)`).join('\n')
      : '• No problems due today — test email only';

    try {
      await emailjs.send(serviceId, templateId, {
        to_email:      recipientEmail,
        date:          todayStr(),
        problem_count: allDue.length || 1,
        overdue_count: overdueList.length,
        due_count:     dueTodayList.length,
        problems_list: problemsText,
      }, publicKey);
      setTestStatus('ok');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTestError(msg);
      setTestStatus('error');
    }
  };

  const inputCls =
    'w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  const stepLabel = (n: SetupStep, label: string) => (
    <button
      onClick={() => setStep(n)}
      className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg transition-colors ${
        step === n
          ? 'bg-blue-500 text-white'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
      }`}
    >
      <span className="font-bold">{n}</span> {label}
    </button>
  );

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Email Reminder Setup</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-lg leading-none">✕</button>
        </div>

        {/* Step navigation */}
        <div className="flex gap-2 flex-wrap mb-5">
          {stepLabel(1, 'Create account')}
          {stepLabel(2, 'Email service')}
          {stepLabel(3, 'Template')}
          {stepLabel(4, 'Your credentials')}
        </div>

        {/* Step content */}
        {step === 1 && (
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <p className="font-medium text-gray-900 dark:text-white">Step 1 — Create a free EmailJS account</p>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400">
              <li>Go to <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">emailjs.com</span> and sign up for free.</li>
              <li>The free tier gives you 200 emails/month — more than enough for daily reminders.</li>
              <li>Once logged in, come back and move to Step 2.</li>
            </ol>
            <button onClick={() => setStep(2)} className="mt-2 text-sm px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors">
              Next →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <p className="font-medium text-gray-900 dark:text-white">Step 2 — Connect your email (Gmail recommended)</p>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400">
              <li>In the EmailJS dashboard, go to <strong>Email Services</strong> → <strong>Add New Service</strong>.</li>
              <li>Choose <strong>Gmail</strong> (or whichever email you want to send from).</li>
              <li>Follow the prompts to connect your account.</li>
              <li>Copy your <strong>Service ID</strong> — it looks like <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">service_xxxxxxx</span>.</li>
              <li>Paste it in Step 4.</li>
            </ol>
            <button onClick={() => setStep(3)} className="mt-2 text-sm px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors">
              Next →
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <p className="font-medium text-gray-900 dark:text-white">Step 3 — Create an email template</p>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400">
              <li>Go to <strong>Email Templates</strong> → <strong>Create New Template</strong>.</li>
              <li>Set <strong>To Email</strong> field to: <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">{'{{to_email}}'}</span></li>
              <li>Set <strong>Subject</strong> to: <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">🧠 NeetCode: {'{{problem_count}}'} problem(s) due {'{{date}}'}</span></li>
              <li>Paste this into the <strong>Body</strong>:</li>
            </ol>
            <pre className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 text-xs whitespace-pre-wrap text-gray-700 dark:text-gray-300 select-all">
{`Hi there!

You have {{problem_count}} problem(s) to revise today ({{date}}):

{{problems_list}}

Keep it up! 💪
NeetCode Tracker`}
            </pre>
            <p className="text-gray-500 dark:text-gray-400 text-xs">Copy your <strong>Template ID</strong> (looks like <span className="font-mono">template_xxxxxxx</span>) and paste it in Step 4.</p>
            <button onClick={() => setStep(4)} className="mt-2 text-sm px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors">
              Next →
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-gray-900 dark:text-white">Step 4 — Enter your credentials</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Find your Public Key in EmailJS → Account → General.</p>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Your email address (where reminders go)</label>
              <input type="email" value={form.recipientEmail} onChange={e => set('recipientEmail', e.target.value)} className={inputCls} placeholder="boluwatifehonour@gmail.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Service ID</label>
              <input type="text" value={form.serviceId} onChange={e => set('serviceId', e.target.value)} className={inputCls} placeholder="service_xxxxxxx" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Template ID</label>
              <input type="text" value={form.templateId} onChange={e => set('templateId', e.target.value)} className={inputCls} placeholder="template_xxxxxxx" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Public Key</label>
              <input type="text" value={form.publicKey} onChange={e => set('publicKey', e.target.value)} className={inputCls} placeholder="xxxxxxxxxxxxxxxxxxxx" />
            </div>

            {/* Enable toggle */}
            <label className="flex items-center gap-3 cursor-pointer pt-1">
              <div
                onClick={() => set('enabled', !form.enabled)}
                className={`relative w-10 h-5 rounded-full transition-colors ${form.enabled ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300">Enable daily email reminders</span>
            </label>

            {/* Test button */}
            <button
              onClick={handleTestEmail}
              disabled={testStatus === 'sending'}
              className="w-full text-sm px-4 py-2 border border-blue-500 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {testStatus === 'sending' ? 'Sending…' : 'Send test email'}
            </button>

            {testStatus === 'ok' && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400">✅ Test email sent! Check your inbox.</p>
            )}
            {testStatus === 'error' && (
              <p className="text-xs text-red-500">❌ Failed: {testError || 'Check your credentials.'}</p>
            )}
          </div>
        )}

        {/* Footer buttons */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
