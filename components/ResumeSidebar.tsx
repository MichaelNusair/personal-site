import {
  Code,
  Boxes,
  Database,
  Workflow,
  Monitor,
  Box,
  GitBranch,
  Cloud,
  ServerCog,
  Dock,
  Globe,
  FlaskConical as Flask,
  Brain,
  BarChart3,
  Wrench,
  GraduationCap,
  ShieldCheck,
  Medal,
} from "lucide-react";

interface ResumeSidebarProps {
  isEditable?: boolean;
}

const Item = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-2">{children}</li>
);

export const ResumeSidebar = ({ isEditable = false }: ResumeSidebarProps) => {
  return (
    <div className="bg-resume-primary text-resume-text-light p-4 sm:p-6 space-y-8 h-full">
      <div>
        <h3 className="text-xl sm:text-2xl font-bold mb-4">Skills</h3>
        <ul className="space-y-2 text-sm">
          {/* Core */}
          <Item>
            <Code className="w-4 h-4 mt-0.5" />{" "}
            <span contentEditable={isEditable} suppressContentEditableWarning>
              TypeScript, JavaScript
            </span>
          </Item>
          {/* Backend & APIs */}
          <Item>
            <Boxes className="w-4 h-4 mt-0.5" />{" "}
            <span contentEditable={isEditable} suppressContentEditableWarning>
              NodeJS, ExpressJS, tRPC
            </span>
          </Item>
          {/* Data */}
          <Item>
            <Database className="w-4 h-4 mt-0.5" />{" "}
            <span contentEditable={isEditable} suppressContentEditableWarning>
              MongoDB, Mongoose
            </span>
          </Item>
          <Item>
            <Workflow className="w-4 h-4 mt-0.5" />{" "}
            <span contentEditable={isEditable} suppressContentEditableWarning>
              GraphQL, Compose
            </span>
          </Item>
          {/* Frontend & UI */}
          <Item>
            <Monitor className="w-4 h-4 mt-0.5" />{" "}
            <span contentEditable={isEditable} suppressContentEditableWarning>
              React, NextJS, MUI, Tailwind, TanStack
            </span>
          </Item>
          {/* Tooling & State */}
          <Item>
            <Box className="w-4 h-4 mt-0.5" />{" "}
            <span contentEditable={isEditable} suppressContentEditableWarning>
              NX, PNPM, Redux, RxJS
            </span>
          </Item>
          {/* Realtime */}
          <Item>
            <ServerCog className="w-4 h-4 mt-0.5" />{" "}
            <span contentEditable={isEditable} suppressContentEditableWarning>
              SSE, WebSockets
            </span>
          </Item>
          {/* Redis & Messaging */}
          <Item>
            <Database className="w-4 h-4 mt-0.5" />{" "}
            <span contentEditable={isEditable} suppressContentEditableWarning>
              Redis, PubSub, Bull, Caching, Locking
            </span>
          </Item>
          {/* Geospatial */}
          <Item>
            <Globe className="w-4 h-4 mt-0.5" />{" "}
            <span contentEditable={isEditable} suppressContentEditableWarning>
              Cesium, DeckGL, AngularJS
            </span>
          </Item>
          {/* Cloud & Infra */}
          <Item>
            <Cloud className="w-4 h-4 mt-0.5" />{" "}
            <span contentEditable={isEditable} suppressContentEditableWarning>
              AWS - ECS, EKS, Serverless
            </span>
          </Item>
          <Item>
            <Cloud className="w-4 h-4 mt-0.5" />{" "}
            <span contentEditable={isEditable} suppressContentEditableWarning>
              Azure - Container Apps
            </span>
          </Item>
          <Item>
            <Dock className="w-4 h-4 mt-0.5" />{" "}
            <span contentEditable={isEditable} suppressContentEditableWarning>
              RedHat – OpenShift (Kubernetes)
            </span>
          </Item>
          {/* DevOps */}
          <Item>
            <GitBranch className="w-4 h-4 mt-0.5" />{" "}
            <span contentEditable={isEditable} suppressContentEditableWarning>
              Docker, Full CI/CD with GitHub Actions and AWS
            </span>
          </Item>
          <Item>
            <Cloud className="w-4 h-4 mt-0.5" />{" "}
            <span contentEditable={isEditable} suppressContentEditableWarning>
              GCP, Geocoding
            </span>
          </Item>
          {/* Scripting & Testing */}
          <Item>
            <Flask className="w-4 h-4 mt-0.5" />{" "}
            <span contentEditable={isEditable} suppressContentEditableWarning>
              Python, Selenium, Puppeteer
            </span>
          </Item>
        </ul>
      </div>

      <div>
        <h3 className="text-xl sm:text-2xl font-bold mb-4">Education</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-2">
            <GraduationCap className="w-4 h-4 mt-0.5" />
            <div>
              <h4
                className="font-bold text-base sm:text-lg"
                contentEditable={isEditable}
                suppressContentEditableWarning
              >
                Open University:
              </h4>
              <p
                className="text-sm"
                contentEditable={isEditable}
                suppressContentEditableWarning
              >
                B.Sc. in Computer Science
              </p>
              <p
                className="text-sm"
                contentEditable={isEditable}
                suppressContentEditableWarning
              >
                In progress — 50% completed
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 mt-0.5" />
            <div>
              <h4
                className="font-bold text-base sm:text-lg"
                contentEditable={isEditable}
                suppressContentEditableWarning
              >
                See-Security College:
              </h4>
              <p
                className="text-sm"
                contentEditable={isEditable}
                suppressContentEditableWarning
              >
                Cybersecurity Intro and Network Administration
              </p>
              <p
                className="text-sm"
                contentEditable={isEditable}
                suppressContentEditableWarning
              >
                SOC Tier 1 Certified
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Medal className="w-4 h-4 mt-0.5" />
            <div>
              <h4
                className="font-bold text-base sm:text-lg"
                contentEditable={isEditable}
                suppressContentEditableWarning
              >
                LPI:
              </h4>
              <p
                className="text-sm"
                contentEditable={isEditable}
                suppressContentEditableWarning
              >
                Linux Essentials Certified
              </p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xl sm:text-2xl font-bold mb-4">Languages</h3>
        <div className="space-y-1 text-sm">
          <p contentEditable={isEditable} suppressContentEditableWarning>
            English - Native
          </p>
          <p contentEditable={isEditable} suppressContentEditableWarning>
            Hebrew - Native
          </p>
        </div>
      </div>
    </div>
  );
};
