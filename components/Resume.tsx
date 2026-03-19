import { ResumeHeader } from "./ResumeHeader";
import { ResumeSidebar } from "./ResumeSidebar";
import { ResumeContent } from "./ResumeContent";

export const Resume = () => {
  const isEditable = false;
  const name = "Michael Nusair";
  const headline = "Software Engineer";
  const subheadline =
    "Ship 0→1 and scale • Hacker & Entrepreneur at nights";

  // Editing disabled: controls removed and isEditable remains false

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Resume container */}
      <div className="max-w-5xl mx-auto my-8 bg-white shadow-2xl rounded-2xl overflow-hidden ring-1 ring-black/5 min-h-[80vh] print:shadow-none print:max-w-none px-4 sm:px-6 md:px-8 print:px-0 print:rounded-none">
        <ResumeHeader
          name={name}
          headline={headline}
          subheadline={subheadline}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-1 order-2 lg:order-1 h-full">
            <ResumeSidebar isEditable={isEditable} />
          </div>
          <div className="lg:col-span-2 order-1 lg:order-2 h-full">
            <ResumeContent isEditable={isEditable} />
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { margin: 0; }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:max-w-none { max-width: none !important; }
        }
      `}</style>
    </div>
  );
};
