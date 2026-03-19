import {
  Phone,
  Mail,
  Linkedin,
  Twitter,
  Github,
  MessageSquare,
} from "lucide-react";
import { Button } from "./ui/button";
import Link from "next/link";

interface ResumeHeaderProps {
  name: string;
  onNameChange?: (name: string) => void;
}

export const ResumeHeader = ({
  name,
  headline = "",
  subheadline = "",
}: ResumeHeaderProps & {
  headline?: string;
  subheadline?: string;
}) => {
  return (
    <div className="bg-gradient-to-r from-resume-primary to-resume-accent text-resume-text-light px-4 sm:px-6 md:px-8 py-6 md:py-8">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="text-center">
          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-resume-text-light leading-tight break-words drop-shadow-sm"
            contentEditable={false}
            suppressContentEditableWarning
          >
            {name}
          </h1>
          <p
            className="mt-2 text-sm sm:text-base md:text-xl text-white/90"
            contentEditable={false}
            suppressContentEditableWarning
          >
            {headline}
          </p>
          <p
            className="mt-2 text-xs sm:text-sm md:text-sm text-white/90"
            contentEditable={false}
            suppressContentEditableWarning
          >
            {subheadline}
          </p>
        </div>

        <div className="w-full">
          <div className="mx-auto w-full max-w-3xl bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 sm:p-5 md:p-6 shadow-lg ring-1 ring-white/20">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <Button
                asChild
                variant="secondary"
                className="w-full justify-start bg-white/15 hover:bg-white/25 text-white"
              >
                <a
                  href="https://x.com/NusairMichael"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="X / Twitter"
                >
                  <Twitter className="w-4 h-4" aria-hidden="true" />
                  <span>X / Twitter</span>
                </a>
              </Button>
              <Button
                asChild
                variant="secondary"
                className="w-full justify-start bg-white/15 hover:bg-white/25 text-white"
              >
                <a
                  href="https://linkedin.com/in/mik-n"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="LinkedIn"
                >
                  <Linkedin className="w-4 h-4" aria-hidden="true" />
                  <span>LinkedIn</span>
                </a>
              </Button>
              <Button
                asChild
                variant="secondary"
                className="w-full justify-start bg-white/15 hover:bg-white/25 text-white"
              >
                <a
                  href="https://github.com/MichaelNusair"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="GitHub"
                >
                  <Github className="w-4 h-4" aria-hidden="true" />
                  <span>GitHub</span>
                </a>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-3">
              <Button
                asChild
                variant="secondary"
                className="w-full justify-start bg-white/15 hover:bg-white/25 text-white"
              >
                <Link href="/chat" title="Chat">
                  <MessageSquare className="w-4 h-4" aria-hidden="true" />
                  <span>Chat with my agent</span>
                </Link>
              </Button>
              <Button
                asChild
                variant="secondary"
                className="w-full justify-start bg-white/15 hover:bg-white/25 text-white"
              >
                <a href="mailto:MNPCMW6444@gmail.com" title="Email">
                  <Mail className="w-4 h-4" aria-hidden="true" />
                  <span>Email me</span>
                </a>
              </Button>
              <Button
                asChild
                variant="secondary"
                className="w-full justify-start bg-white/15 hover:bg-white/25 text-white"
              >
                <a href="tel:+972528971871" title="Call">
                  <Phone className="w-4 h-4" aria-hidden="true" />
                  <span>Call me</span>
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
