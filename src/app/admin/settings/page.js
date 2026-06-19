'use client';

import { useState } from 'react';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    platformName: 'Job Fair',
    supportEmail: 'support@jobfair.com',
    autoApproveStudents: false,
    autoApproveCompanies: false,
    maintenanceMode: false,
    emailNotifications: true,
    smsAlerts: false,
    twoFactorAuth: false,
  });

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
    }, 1200);
  };

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const tabs = [
    { id: 'general', name: 'General', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path> },
    { id: 'security', name: 'Security', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path> },
    { id: 'notifications', name: 'Notifications', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path> },
    { id: 'advanced', name: 'Advanced', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path> }
  ];

  const Toggle = ({ label, description, isOn, onClick }) => (
    <div className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-indigo-200 hover:shadow-md transition-all group">
      <div>
        <p className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{label}</p>
        <p className="text-sm text-slate-500 mt-1">{description}</p>
      </div>
      <button 
        onClick={onClick}
        className={`w-14 h-7 rounded-full relative transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isOn ? 'bg-indigo-600' : 'bg-slate-300'}`}
      >
        <div className={`w-5 h-5 bg-white rounded-full absolute top-1 shadow-sm transition-transform duration-300 flex items-center justify-center ${isOn ? 'left-8' : 'left-1'}`}>
          {isOn && <svg className="w-3 h-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
        </div>
      </button>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-2">System Settings</h1>
          <p className="text-slate-500 font-medium">Manage your platform configurations and preferences.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white shadow-lg transition-all ${isSaving ? 'bg-indigo-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-indigo-500/30 hover:scale-105'}`}
        >
          {isSaving ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Saving...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
              Save Changes
            </>
          )}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2 overflow-hidden flex lg:flex-col gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                <svg className={`w-5 h-5 ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">{tab.icon}</svg>
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-8 min-h-[500px]">
          {activeTab === 'general' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-1">General Configuration</h3>
                <p className="text-sm text-slate-500 mb-6">Basic settings for the Job Fair platform.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Platform Name</label>
                    <input 
                      type="text" 
                      name="platformName"
                      value={settings.platformName} 
                      onChange={handleInputChange}
                      className="w-full border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl px-4 py-3 transition-all outline-none text-slate-700 font-medium" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Support Email</label>
                    <input 
                      type="email" 
                      name="supportEmail"
                      value={settings.supportEmail} 
                      onChange={handleInputChange}
                      className="w-full border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl px-4 py-3 transition-all outline-none text-slate-700 font-medium" 
                    />
                  </div>
                </div>
              </div>

              <div className="h-px bg-slate-100 my-8"></div>

              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-6">Approval Settings</h3>
                <div className="space-y-4">
                  <Toggle 
                    label="Auto-Approve Students" 
                    description="Automatically grant access to new student registrations without manual review."
                    isOn={settings.autoApproveStudents}
                    onClick={() => toggleSetting('autoApproveStudents')}
                  />
                  <Toggle 
                    label="Auto-Approve Companies" 
                    description="Automatically approve new HR/Company registrations."
                    isOn={settings.autoApproveCompanies}
                    onClick={() => toggleSetting('autoApproveCompanies')}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-1">Security & Access</h3>
                <p className="text-sm text-slate-500 mb-6">Manage authentication and platform security.</p>
                
                <div className="space-y-4">
                  <Toggle 
                    label="Require Two-Factor Authentication" 
                    description="Enforce 2FA for all admin and company accounts."
                    isOn={settings.twoFactorAuth}
                    onClick={() => toggleSetting('twoFactorAuth')}
                  />
                  <Toggle 
                    label="Session Timeout" 
                    description="Automatically log out users after 30 minutes of inactivity."
                    isOn={true}
                    onClick={() => {}}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-1">Communication</h3>
                <p className="text-sm text-slate-500 mb-6">Configure how the system sends updates.</p>
                
                <div className="space-y-4">
                  <Toggle 
                    label="Email Notifications" 
                    description="Send email alerts for new registrations and approvals."
                    isOn={settings.emailNotifications}
                    onClick={() => toggleSetting('emailNotifications')}
                  />
                  <Toggle 
                    label="SMS Alerts" 
                    description="Send SMS messages for critical platform updates."
                    isOn={settings.smsAlerts}
                    onClick={() => toggleSetting('smsAlerts')}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-1">Advanced Settings</h3>
                <p className="text-sm text-slate-500 mb-6">Danger zone and system maintenance.</p>
                
                <div className="space-y-4">
                  <Toggle 
                    label="Maintenance Mode" 
                    description="Disable access for all students and companies. Only admins can log in."
                    isOn={settings.maintenanceMode}
                    onClick={() => toggleSetting('maintenanceMode')}
                  />
                  
                  <div className="mt-8 p-5 border border-red-200 bg-red-50 rounded-2xl">
                    <h4 className="text-red-700 font-bold mb-2">Danger Zone</h4>
                    <p className="text-sm text-red-600 mb-4">Actions here are irreversible. Please be certain before proceeding.</p>
                    <button className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-sm transition-colors">
                      Factory Reset Database
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
