'use client';

import { useState, useEffect } from 'react';

export default function AdminAssessments() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterDomain, setFilterDomain] = useState('All');

  const [formData, setFormData] = useState({
    domain: 'React',
    questionText: '',
    option0: '', option1: '', option2: '', option3: '',
    correctOptionIndex: 0,
    difficulty: 'Medium'
  });

  const fetchQuestions = async () => {
    try {
      const res = await fetch(`/api/admin/questions?domain=${filterDomain}`);
      const data = await res.json();
      if (data.success) {
        setQuestions(data.questions);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [filterDomain]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    const payload = {
      domain: formData.domain,
      questionText: formData.questionText,
      options: [formData.option0, formData.option1, formData.option2, formData.option3],
      correctOptionIndex: parseInt(formData.correctOptionIndex),
      difficulty: formData.difficulty
    };

    try {
      const res = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.success) {
        setShowModal(false);
        setFormData({
          domain: 'React', questionText: '', 
          option0: '', option1: '', option2: '', option3: '', 
          correctOptionIndex: 0, difficulty: 'Medium'
        });
        fetchQuestions();
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Failed to add question');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Question Bank</h1>
          <p className="text-slate-500 mt-1">Manage assessment questions and topics</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5">
          + Add New Question
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-8">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex gap-4 items-center">
          <label className="font-semibold text-slate-700 text-sm">Filter Domain:</label>
          <select 
            value={filterDomain} 
            onChange={(e) => setFilterDomain(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 font-medium"
          >
            <option value="All">All Domains</option>
            <option value="React">React</option>
            <option value="Node.js">Node.js</option>
            <option value="Python">Python</option>
            <option value="Java">Java</option>
            <option value="Data Structures">Data Structures</option>
            <option value="Aptitude">Aptitude</option>
          </select>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading questions...</div>
        ) : questions.length === 0 ? (
          <div className="p-16 text-center">
             <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100 text-slate-400">
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
             </div>
             <p className="text-lg font-medium text-slate-600">No questions found.</p>
             <p className="text-slate-400 text-sm mt-1">Click the button above to add your first question to the bank.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="p-4 pl-6 font-semibold">Domain</th>
                  <th className="p-4 font-semibold w-1/2">Question</th>
                  <th className="p-4 font-semibold">Difficulty</th>
                  <th className="p-4 pr-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {questions.map((q) => (
                  <tr key={q._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 pl-6">
                      <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-medium text-xs">{q.domain}</span>
                    </td>
                    <td className="p-4 text-slate-700 font-medium">
                      {q.questionText}
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full font-medium text-xs ${
                        q.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-700' :
                        q.difficulty === 'Medium' ? 'bg-amber-50 text-amber-700' :
                        'bg-red-50 text-red-700'
                      }`}>
                        {q.difficulty}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <button className="text-indigo-600 hover:text-indigo-800 font-medium text-sm">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-2xl font-bold text-slate-800">Add New Question</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 rounded-full w-8 h-8 flex items-center justify-center transition-colors">✕</button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-8">
              <form id="question-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Domain Topic</label>
                    <select value={formData.domain} onChange={e => setFormData({...formData, domain: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white font-medium">
                      <option value="React">React</option>
                      <option value="Node.js">Node.js</option>
                      <option value="Python">Python</option>
                      <option value="Java">Java</option>
                      <option value="Data Structures">Data Structures</option>
                      <option value="Aptitude">Aptitude</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Difficulty</label>
                    <select value={formData.difficulty} onChange={e => setFormData({...formData, difficulty: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white font-medium">
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Question Text</label>
                  <textarea required rows="3" value={formData.questionText} onChange={e => setFormData({...formData, questionText: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white font-medium" placeholder="E.g., What is a Hook in React?"></textarea>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-bold text-slate-700">Answer Options</label>
                  {[0, 1, 2, 3].map((index) => (
                    <div key={index} className="flex gap-4 items-center">
                      <span className="font-bold text-slate-400 w-6">{(index + 1)}.</span>
                      <input 
                        required 
                        type="text" 
                        value={formData[`option${index}`]} 
                        onChange={e => setFormData({...formData, [`option${index}`]: e.target.value})} 
                        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white text-sm" 
                        placeholder={`Option ${index + 1}`} 
                      />
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-600 cursor-pointer">
                        <input 
                          type="radio" 
                          name="correctOption" 
                          checked={formData.correctOptionIndex === index} 
                          onChange={() => setFormData({...formData, correctOptionIndex: index})}
                          className="w-4 h-4 text-indigo-600"
                        />
                        Correct
                      </label>
                    </div>
                  ))}
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
              <button type="submit" form="question-form" disabled={submitting} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5 disabled:opacity-50">
                {submitting ? 'Saving...' : 'Save Question'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
