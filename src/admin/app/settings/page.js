export default function AdminSettings() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 mb-8">System Settings</h1>
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="max-w-xl">
          <h3 className="text-xl font-bold text-slate-800 mb-6">General Configuration</h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Platform Name</label>
              <input type="text" defaultValue="JobFair Pro" className="w-full border border-slate-200 rounded-lg px-4 py-2" readOnly />
            </div>
            
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <p className="font-semibold text-slate-700">Auto-Approve Students</p>
                <p className="text-sm text-slate-500">Automatically grant access to new student registrations.</p>
              </div>
              <div className="w-12 h-6 bg-slate-300 rounded-full relative cursor-not-allowed">
                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm"></div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <p className="font-semibold text-slate-700">Maintenance Mode</p>
                <p className="text-sm text-slate-500">Disable access for all students and companies.</p>
              </div>
              <div className="w-12 h-6 bg-slate-300 rounded-full relative cursor-not-allowed">
                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
