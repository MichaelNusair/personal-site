import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "./ui/accordion";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "./ui/tooltip";

interface ResumeContentProps {
  isEditable?: boolean;
}

export const ResumeContent = ({ isEditable = false }: ResumeContentProps) => {
  return (
    <div className="bg-white text-resume-text-dark p-4 sm:p-6 md:p-8 space-y-8 h-full">
      <div>
        <div className="bg-gradient-to-r from-resume-primary to-resume-accent text-resume-text-light px-4 sm:px-6 py-3 -mx-4 sm:-mx-6 md:-mx-8 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold">About me</h2>
        </div>
        <div className="text-sm leading-relaxed space-y-4">
          <p>
            <strong>Experienced Full Stack Engineer</strong> specializing in the{" "}
            <strong>Web/TypeScript stack</strong>, with{" "}
            <strong>cloud-native architectures</strong> across{" "}
            <strong>Kubernetes</strong> and <strong>AWS Serverless</strong>. I'm
            comfortable designing systems at any scale—avoiding unnecessary
            complexity early on, while applying advanced patterns when scale or
            resilience actually requires them. Skilled in{" "}
            <strong>event-driven patterns</strong>,{" "}
            <strong>distributed workflows</strong>,{" "}
            <strong>container orchestration</strong>,{" "}
            <strong>microservices</strong>, and building reliable systems. I'm
            also a <strong>CI/CD fan</strong>, comfortable with DevOps tasks,
            and quick to set up pipelines from day one.
          </p>
          <p>
            While being a team player, I thrive in{" "}
            <strong>high-ownership, ambiguous environments</strong>—clarifying
            problems and shipping iteratively from zero to scale. I have a
            strong <strong>leadership and mentoring background</strong> and am
            seeking a role that blends challenging R&D problems with technical
            leadership.
          </p>
        </div>
      </div>

      {/* Ventures */}
      <div>
        <Accordion type="single" collapsible>
          <AccordionItem value="ventures-root" className="border-b-0">
            <div className="bg-gradient-to-r from-resume-primary to-resume-accent text-resume-text-light -mx-4 sm:-mx-6 md:-mx-8 mb-6">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AccordionTrigger className="px-4 sm:px-6 py-3 text-xl sm:text-2xl font-bold text-resume-text-light hover:no-underline">
                      Nights & Weekends: Ventures
                    </AccordionTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Night projects</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <AccordionContent>
              <div className="text-sm space-y-2">
                <Accordion type="multiple" className="space-y-2">
                  <AccordionItem value="venture-loxia">
                    <AccordionTrigger className="font-semibold">
                      Loxia.ai — Automated GraphQL black‑box
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="mb-2">
                        Built an engine that turns schemas and business rules
                        into deployable GraphQL APIs; Node/Express services with
                        a React/Next.js admin—primarily backend focused.
                      </p>
                      <a
                        href="https://loxia.ai"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        https://loxia.ai
                      </a>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="venture-cubebox">
                    <AccordionTrigger className="font-semibold">
                      CubeBox.co.il — Crafting your home, your way
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="mb-2">
                        Personalized the home‑buying journey; integrated
                        lenders/CRMs on a Node/Express backend and shipped a
                        Next.js/Bootstrap front end—spent most time on backend
                        integrations.
                      </p>
                      <a
                        href="https://cubebox.co.il"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        https://cubebox.co.il
                      </a>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="venture-offsito">
                    <AccordionTrigger className="font-semibold">
                      Offsito.com — Your office when you’re off‑site
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="mb-2">
                        Marketplace for office subleasing with time‑boxed
                        agreements; designed data model, payments and listings,
                        with a Next.js client and Node APIs.
                      </p>
                      <a
                        href="https://offsito.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        https://offsito.com
                      </a>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="venture-failean">
                    <AccordionTrigger className="font-semibold">
                      Failean and Scailean — Failean/Scailean AI accelerator
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="mb-2">
                        Bootstrapped an AI‑accelerator that generates business
                        plans and GTM assets; evolved from “failean” to
                        “scailean” via A/B tests; multi‑repo system (6 services,
                        4 apps) used by real users and generated revenue.
                      </p>
                      <div className="space-x-2">
                        <a
                          href="https://t.ly/d-8BY"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          demo 1
                        </a>
                        <span>/</span>
                        <a
                          href="https://t.ly/iDNwf"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          demo 2
                        </a>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="venture-couplelink">
                    <AccordionTrigger className="font-semibold">
                      Couple‑Link.com — Transform Your Relationship with
                      AI-Guided Conversations
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="mb-2">
                        AI-powered conversational platform that helps couples
                        build stronger relationships through guided
                        conversations and personalized insights.
                      </p>
                      <a
                        href="https://coupelink.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        https://CoupeLink.com
                      </a>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="venture-otho">
                    <AccordionTrigger className="font-semibold">
                      Othofeed.com — Your bugs write their own tickets
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="mb-2">
                        Capture pixel-perfect session recordings with rrweb,
                        analyze with GPT-4, and auto-generate Linear/Jira
                        tickets. One script tag, infinite insights.
                      </p>
                      <a
                        href="https://othofeed.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        https://othofeed.com
                      </a>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <p className="text-gray-500 italic mt-4">
                  And lots more — seriously, since you can do it with AI in one
                  day, I stopped adding them here.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Experience */}
      <div>
        <div className="bg-gradient-to-r from-resume-primary to-resume-accent text-resume-text-light px-4 sm:px-6 py-3 -mx-4 sm:-mx-6 md:-mx-8 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold">Experience</h2>
        </div>

        <Accordion
          type="multiple"
          defaultValue={["exp-tolstoy"]}
          className="space-y-2"
        >
          {/* Tolstoy */}
          <AccordionItem value="exp-tolstoy">
            <AccordionTrigger className="py-3">
              <div className="flex items-center gap-3">
                <img
                  src="/tolstoy.png"
                  alt="Tolstoy logo"
                  className="h-6 w-6 object-contain"
                />
                <span className="text-xl sm:text-2xl font-bold">Tolstoy</span>
              </div>
              <span className="ml-4 text-sm text-gray-500 font-normal">
                Full-Stack Engineer — April 2025 – Now
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm mb-3">
                Joined the AI platform/player team and led the{" "}
                <strong>Tolstoy Media Gallery</strong> from concept to
                production—a fully-featured replacement for Shopify's native
                media gallery, with rich analytics and an automated A/B testing
                system. <strong>E2E project ownership</strong>—Designed and
                implemented all parts, including:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1 ml-4 mb-3">
                <li>
                  <strong>Serverless AWS CDK</strong> infrastructure and
                  backend.
                </li>
                <li>
                  <strong>
                    Shopify-compatible server-side-rendered widget
                  </strong>{" "}
                  for best performance and resilience.
                </li>
                <li>
                  Consistently-designed <strong>ShadCN control plane</strong>{" "}
                  for merchants.
                </li>
              </ul>
              <ul className="list-disc list-inside text-sm space-y-1 ml-4 mb-3">
                <li>
                  Quickly explored the <strong>Shopify Admin API</strong> and
                  architected an optimized serverless backend with{" "}
                  <strong>Lambda, SQS, DynamoDB, and RDS</strong>, exposing a
                  structured API with <strong>Zod schemas</strong>.
                </li>
                <li>
                  Built <strong>analytics pipelines</strong> using{" "}
                  <strong>CubeJS</strong> to aggregate data from{" "}
                  <strong>Snowflake</strong>.
                </li>
                <li>
                  Created a maintainable workflow to write{" "}
                  <strong>Preact</strong> code once and compile it to both SSR
                  Liquid templates and CSR hydration scripts, releasing this as
                  the open-source mini-framework{" "}
                  <a
                    href="https://github.com/MichaelNusair/preliquify"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Preliquify
                  </a>
                  .
                </li>
                <li>
                  Leveraged <strong>Cursor IDE</strong> (and other AI tools) for
                  AI-assisted development, accelerating iteration cycles, while
                  heavily integrating <strong>GenAI</strong> into products.
                </li>
              </ul>
              <a
                href="https://gotolstoy.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-sm"
              >
                https://gotolstoy.com
              </a>
            </AccordionContent>
          </AccordionItem>

          {/* DefenseTech - Full-Stack Engineer */}
          <AccordionItem value="exp-defense">
            <AccordionTrigger className="py-3">
              <span className="text-xl sm:text-2xl font-bold">DefenseTech</span>
              <span className="ml-4 text-sm text-gray-500 font-normal">
                Full-Stack Engineer — October 2021 – April 2025
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm mb-3">
                Transitioned into the development team for a main{" "}
                <strong>Command & Control system</strong>, a mission-critical
                application for <strong>defense operations and safety</strong>.
              </p>

              <div className="space-y-4">
                <div>
                  <p className="font-semibold underline">Frontend:</p>
                  <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                    <li>
                      Maintained a legacy{" "}
                      <strong>
                        AngularJS-Cesium pioneering web-based system
                      </strong>
                      , a project originally initiated in 2014, while optimizing
                      performance and integrating modern <strong>React</strong>{" "}
                      and <strong>MUI</strong> components using{" "}
                      <strong>react2angular</strong>.
                    </li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold underline">Backend:</p>
                  <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                    <li>
                      Designed and developed a{" "}
                      <strong>Node.js-based distributed system</strong>,
                      migrating from a monolithic architecture to{" "}
                      <strong>30+ microservices</strong>. Led a new{" "}
                      <strong>real-time notifications feature</strong> from 0.
                    </li>
                    <li>
                      In the last year, led the adoption of{" "}
                      <strong>Tyk as our API gateway</strong>, integrating it
                      with an <strong>rhSSO solution</strong> to meet
                      authentication and authorization requirements. This role
                      involved overcoming significant challenges, deepening my
                      understanding of{" "}
                      <strong>
                        API gateways, identity management, and security
                        protocols
                      </strong>
                      .
                    </li>
                    <li>
                      Utilized <strong>GraphQL</strong> as the standard
                      framework for backend APIs, on-prem{" "}
                      <strong>MongoDB replica set</strong> as main DB,{" "}
                      <strong>Mongoose</strong> as ORM and{" "}
                      <strong>Redis</strong> for{" "}
                      <strong>queueing, caching, and Pub/Sub</strong> features.
                    </li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold underline">
                    DevOps & Operations:
                  </p>
                  <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                    <li>
                      <strong>Kubernetes</strong> deployments and CI/CD
                      pipelines with <strong>Jenkins, Helm</strong>, and{" "}
                      <strong>ArgoCD</strong>.
                    </li>
                    <li>
                      Led the system's{" "}
                      <strong>Disaster Recovery Plan (DRP)</strong>, conducting
                      experiments to improve{" "}
                      <strong>multi-regional resilience</strong>.
                    </li>
                    <li>
                      Senior <strong>on-call engineer</strong>, responsible for
                      troubleshooting{" "}
                      <strong>critical production issues</strong> in a 24/7
                      rotation during high-stakes operational periods.
                    </li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Product Manager */}
          <AccordionItem value="exp-pm">
            <AccordionTrigger className="py-3">
              <span className="text-xl sm:text-2xl font-bold">
                Product Manager
              </span>
              <span className="ml-4 text-sm text-gray-500 font-normal">
                October 2020 – October 2021
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm">
                Managing the development and assimilation process of all new
                systems/versions used in the control division. Represented{" "}
                <strong>hundreds of operational users</strong> while pushing the
                product forward, dealing with complex bug fixes and new features
                from conception to deployment, all under the strict directives
                of <strong>operating capability declaration</strong>.
              </p>
            </AccordionContent>
          </AccordionItem>

          {/* Operations Specialist */}
          <AccordionItem value="exp-ops">
            <AccordionTrigger className="py-3">
              <span className="text-xl sm:text-2xl font-bold">
                Operations Specialist
              </span>
              <span className="ml-4 text-sm text-gray-500 font-normal">
                2016 - 2020
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm">
                Held <strong>high-responsibility roles</strong>, both while
                overseeing <strong>operational shifts</strong> and leading
                teams, as well as <strong>managing strategic projects</strong>{" "}
                when not on shift.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
};
