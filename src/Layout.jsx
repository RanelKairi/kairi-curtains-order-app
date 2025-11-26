import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { FileText, Plus } from 'lucide-react';

export default function Layout({ children, currentPageName }) {
  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to={createPageUrl('OrdersList')} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-slate-800">קאירי וילונות</span>
          </Link>
          
          <div className="flex items-center gap-2">
            <Link 
              to={createPageUrl('OrdersList')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentPageName === 'OrdersList' 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              הזמנות
            </Link>
            <Link 
              to={createPageUrl('NewOrder')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentPageName === 'NewOrder' 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              הזמנה חדשה
            </Link>
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <main>
        {children}
      </main>
    </div>
  );
}