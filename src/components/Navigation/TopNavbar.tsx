import React, { useState, useEffect } from 'react';
import {
  Check,
  Edit2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Menu,
  Save,
  FileDown,
} from 'lucide-react';
import { FacingDirection, LandDetails } from '../../types';

interface TopNavbarProps {
  projectName: string;
  onUpdateProjectName: (name: string) => void;
  statusText?: string;
  isReady?: boolean;
  land?: LandDetails;
  facingDirection?: FacingDirection;
  roomsCount?: number;
  onToggleMobileMenu: () => void;
  onNavigateToExport?: () => void;
  onStartNewProject: () => void;
  onOpenHelp?: () => void;
  activeStageTitle?: string;
}

export const TopNavbar: React.FC<TopNavbarProps> = React.memo(({
  projectName,
  onUpdateProjectName,
  isReady,
  onToggleMobileMenu,
  onNavigateToExport,
  onOpenHelp,
  activeStageTitle,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(projectName);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setTempName(projectName);
  }, [projectName]);

  const handleSaveName = () => {
    setIsEditingName(false);
    if (tempName.trim()) {
      onUpdateProjectName(tempName.trim());
    }
  };

  const handleQuickSave = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <header className="sticky top-0 z-30 bg-[#FFFFFF] border-b border-[#E2E8F0] h-16 flex items-center shrink-0">
      <div className="w-full px-4 lg:px-8 flex items-center justify-between">
        
        {/* Left: Mobile Toggle + Project Identity */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 -ml-2 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] rounded-lg transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Project Name Breadcrumb / Editor */}
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs font-mono font-medium text-[#94A3B8]">
              PROJECT /
            </span>

            {isEditingName ? (
              <div className="flex items-center gap-1.5 bg-[#F8FAFC] px-2.5 py-1 rounded-lg border border-[#2563EB]">
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') {
                      setTempName(projectName);
                      setIsEditingName(false);
                    }
                  }}
                  autoFocus
                  className="text-xs sm:text-sm font-semibold text-[#0F172A] bg-transparent outline-none w-44 sm:w-60"
                  placeholder="Project Name"
                />
                <button
                  type="button"
                  onClick={handleSaveName}
                  className="text-[#2563EB] hover:text-[#1D4ED8] p-1 cursor-pointer"
                  title="Save Project Name"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingName(true)}
                className="group flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#0F172A] px-2 py-1 rounded-md transition-colors max-w-[160px] sm:max-w-[280px] md:max-w-[400px] truncate text-left cursor-pointer hover:bg-[#F8FAFC]"
                title="Click to rename project"
              >
                <span className="truncate">{projectName}</span>
                <Edit2 className="w-3 h-3 text-[#94A3B8] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </button>
            )}

            {activeStageTitle && (
              <span className="hidden md:inline-flex items-center text-xs text-[#64748B] before:content-['•'] before:mx-2 before:text-[#CBD5E1]">
                {activeStageTitle}
              </span>
            )}
          </div>
        </div>

        {/* Right: Validation Status, Help & Save Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Validation Status Pill */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold transition-colors ${
              isReady
                ? 'bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7]'
                : 'bg-[#FFFBEB] text-[#D97706] border border-[#FEF3C7]'
            }`}
          >
            {isReady ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5" />
            )}
            <span className="hidden xs:inline">
              {isReady ? 'Architecture Valid' : 'Draft In Progress'}
            </span>
          </div>

          <div className="h-4 w-[1px] bg-[#E2E8F0] hidden sm:block mx-1" />

          {/* Help Button */}
          {onOpenHelp && (
            <button
              type="button"
              onClick={onOpenHelp}
              className="p-2 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] rounded-lg transition-colors cursor-pointer"
              title="Design Guide & Help"
              aria-label="Design Guide & Help"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          )}

          {/* Export Action */}
          {onNavigateToExport && (
            <button
              type="button"
              onClick={onNavigateToExport}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#475569] hover:text-[#0F172A] bg-[#FFFFFF] border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-lg transition-colors cursor-pointer shadow-2xs"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          )}

          {/* Save Button */}
          <button
            type="button"
            onClick={handleQuickSave}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer shadow-xs ${
              saveSuccess
                ? 'bg-[#16A34A] text-white'
                : 'bg-[#0F172A] hover:bg-[#1E293B] text-white'
            }`}
          >
            {saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span className="hidden sm:inline">Saved</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
});


