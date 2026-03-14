export interface FaqItem {
  question: string;
  answer: string;
}

export interface VideoClip {
  name: string;
  startOffset: number;
  endOffset?: number;
  url: string;
}

export interface VideoSchemaConfig {
  name: string;
  description: string;
  url: string;
  embedUrl: string;
  thumbnailUrl: string;
  uploadDate: string;
  duration?: string;
  clips?: VideoClip[];
}

export interface MarketingSection {
  heading: string;
  body: string;
  bullets?: string[];
}

export interface ResourceArticle {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  summary: string;
  audience: string;
  keywords: string[];
  sections: MarketingSection[];
}

export interface IndustryPage {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  summary: string;
  audience: string;
  keywords: string[];
  workflows: string[];
  sections: MarketingSection[];
}

export const homepageFaqItems: FaqItem[] = [
  {
    question: 'How do I integrate Gemini API with Python?',
    answer:
      'We walk you through setup step by step: create an API key, configure a Python client, send prompts, and connect Gemini outputs into real workflows like email triage and reporting automations.'
  },
  {
    question: 'Is this course for non-coders?',
    answer:
      'Yes. Non-coders can use the no-code automation path, while developers can take the Python and API modules for deeper custom integrations.'
  },
  {
    question: 'How to use AI for business automation?',
    answer:
      'Start with one repetitive process, define trigger-to-outcome steps, insert an LLM for decision logic, then connect your tools like email, CRM, docs, and spreadsheets with clear quality checks.'
  },
  {
    question: 'Does the course cover OpenAI, Anthropic, and Gemini workflows?',
    answer:
      'Yes. The curriculum is implementation-focused, so the emphasis is on choosing the right model for the task, wiring prompts into tools, and shipping stable automations instead of chasing one vendor.'
  },
  {
    question: 'Will I ship a real workflow or just watch lessons?',
    answer:
      'The goal is a real deployment. The course is structured around build milestones, implementation checklists, and a working bot or automation that you can test inside your own business process.'
  }
];

export const homepageVideoObject: VideoSchemaConfig = {
  name: 'AI Integration Course: 2-Minute Automation Walkthrough',
  description:
    'A short course trailer showing Gemini API integration, AI workflow automation, and practical implementation steps for business use cases.',
  url: 'https://www.youtube.com/watch?v=smkBKoxwzdE',
  embedUrl: 'https://www.youtube.com/embed/smkBKoxwzdE',
  thumbnailUrl: 'https://img.youtube.com/vi/smkBKoxwzdE/maxresdefault.jpg',
  uploadDate: '2025-01-01',
  duration: 'PT2M',
  clips: [
    { name: 'Gemini API Setup', startOffset: 0, endOffset: 40, url: 'https://www.youtube.com/watch?v=smkBKoxwzdE&t=0s' },
    { name: 'No-Code Automation Flow', startOffset: 41, endOffset: 90, url: 'https://www.youtube.com/watch?v=smkBKoxwzdE&t=41s' },
    { name: 'Production Rollout Checklist', startOffset: 91, endOffset: 120, url: 'https://www.youtube.com/watch?v=smkBKoxwzdE&t=91s' }
  ]
};

export const resourceLibraryItems: ResourceArticle[] = [
  {
    slug: 'rag-for-small-business',
    title: 'RAG for Small Business',
    eyebrow: 'Library Guide',
    description:
      'Learn how retrieval-augmented generation helps small businesses answer questions from their own SOPs, product docs, and customer knowledge instead of relying on generic model memory.',
    summary:
      'RAG gives small teams a practical way to build AI that stays grounded in their own policies, pricing, and internal documentation.',
    audience: 'Business owners, operators, and developers building internal copilots or support assistants.',
    keywords: ['RAG for small business', 'retrieval augmented generation SMB', 'AI knowledge base workflow'],
    sections: [
      {
        heading: 'What RAG changes for a small team',
        body:
          'A small business does not need a custom model to get trustworthy AI answers. In most cases, it needs a retrieval layer that pulls the right policy, spreadsheet row, or support article at the moment the model is asked to respond.',
        bullets: [
          'Use RAG to answer customer questions from your real docs.',
          'Keep pricing, refund rules, and SOP references current without retraining a model.',
          'Reduce hallucinations by forcing the model to cite retrieved context.'
        ]
      },
      {
        heading: 'Best first use cases',
        body:
          'The highest-leverage early wins usually live in repetitive knowledge workflows where the answer already exists but takes too long to find manually.',
        bullets: [
          'Customer support FAQ assistants',
          'Internal team copilots for onboarding and SOP lookup',
          'Proposal drafting using product, pricing, and case-study context'
        ]
      },
      {
        heading: 'Implementation path inside the course',
        body:
          'The course walks through the build path from raw document collection to chunking, retrieval logic, evaluation, and workflow handoff so you can move from concept to production checklist.',
        bullets: [
          'Collect and normalize business documents',
          'Create retrieval-friendly chunks and metadata',
          'Add citations, guardrails, and review checkpoints before rollout'
        ]
      }
    ]
  },
  {
    slug: 'function-calling-with-gemini-1-5-pro',
    title: 'Function Calling with Gemini 1.5 Pro',
    eyebrow: 'Developer Guide',
    description:
      'A practical guide to function calling with Gemini-style tool use: define structured actions, validate payloads, and connect model decisions to real business systems.',
    summary:
      'Function calling turns a chat model from a text generator into a workflow orchestrator that can choose tools, pass arguments, and trigger business actions safely.',
    audience: 'Developers and technical operators wiring LLMs into CRMs, inboxes, spreadsheets, and internal APIs.',
    keywords: ['Function Calling with Gemini 1.5 Pro', 'Gemini tool calling Python', 'LLM automation architecture'],
    sections: [
      {
        heading: 'Why function calling matters',
        body:
          'Text-only prompting is not enough when the workflow has to send an email, write to a CRM, or query a record. Function calling gives the model a constrained menu of actions so it can decide what to do without inventing its own format.',
        bullets: [
          'Define a narrow tool contract for each action.',
          'Validate arguments before execution.',
          'Log model intent and tool output for debugging.'
        ]
      },
      {
        heading: 'Python integration pattern',
        body:
          'The most stable pattern is model decides, Python validates, then the business system executes. That keeps the model in the reasoning layer and keeps side effects inside normal application code.',
        bullets: [
          'Schema first: write the tool signature before prompt design.',
          'Guard every tool call with validation and retries.',
          'Return machine-readable results back into the conversation loop.'
        ]
      },
      {
        heading: 'What the course focuses on',
        body:
          'Inside the curriculum, function calling is treated as operations engineering, not novelty. The emphasis is on dependable automations that survive bad inputs, ambiguous tickets, and edge-case user requests.',
        bullets: [
          'Inbox triage and routing tools',
          'Lead qualification workflows',
          'Action logs, human review, and rollback rules'
        ]
      }
    ]
  },
  {
    slug: 'openai-vs-anthropic-for-automation',
    title: 'OpenAI vs. Anthropic for Automation',
    eyebrow: 'Comparison Guide',
    description:
      'A decision-making framework for choosing between OpenAI and Anthropic when building automation workflows, internal copilots, and structured business processes.',
    summary:
      'Model choice matters less than system design, but there are real workflow tradeoffs in speed, reliability, tone, and tool use that operators should evaluate deliberately.',
    audience: 'Founders, ops leaders, and developers choosing an LLM stack for automation work.',
    keywords: ['OpenAI vs Anthropic for automation', 'best LLM for business workflows', 'AI model comparison automation'],
    sections: [
      {
        heading: 'Choose for the workflow, not the brand',
        body:
          'The best model for a content brainstorm may not be the best model for a support workflow. Automation stacks should be evaluated on response quality, structured output reliability, latency tolerance, and operational cost.',
        bullets: [
          'Benchmark on your real tickets, SOPs, and business prompts.',
          'Measure failure handling, not just best-case output.',
          'Keep a fallback strategy so the system is not married to one vendor.'
        ]
      },
      {
        heading: 'What strong operators compare',
        body:
          'Business automation teams should compare the same set of operational criteria on every model they test.',
        bullets: [
          'Structured output consistency',
          'Tool-use reliability and schema adherence',
          'Handling of long context, policy text, and messy user inputs'
        ]
      },
      {
        heading: 'How the course helps you decide',
        body:
          'The course is designed to stay vendor-flexible. You learn how to define evaluation criteria, test prompts against multiple providers, and ship the workflow that fits your operational constraints.',
        bullets: [
          'Create model scorecards for business tasks',
          'Separate prompt quality from system quality',
          'Design workflows that can swap models without a full rebuild'
        ]
      }
    ]
  }
];

export const industryPages: IndustryPage[] = [
  {
    slug: 'real-estate',
    title: 'AI Integration for Real Estate',
    eyebrow: 'Industry Workflow',
    description:
      'AI integration ideas for real estate teams: lead routing, listing summary generation, showing follow-up, and FAQ automation for agents and brokerages.',
    summary:
      'Real estate teams win with AI when they reduce response time, standardize follow-up, and make property knowledge searchable across the team.',
    audience: 'Agents, brokerages, transaction coordinators, and real estate ops teams.',
    keywords: ['AI integration for real estate', 'real estate automation AI', 'AI for brokerages'],
    workflows: [
      'Lead qualification and handoff',
      'Listing summary generation from notes and MLS copy',
      'Buyer and seller FAQ assistants',
      'Showing follow-up and nurture sequences'
    ],
    sections: [
      {
        heading: 'Where AI saves time in real estate',
        body:
          'Real estate work is communication-heavy, deadline-heavy, and document-heavy. That makes it a strong fit for AI systems that draft, summarize, classify, and route repetitive work without removing the human agent from the decision loop.'
      },
      {
        heading: 'Recommended first pilot',
        body:
          'The safest first pilot is usually a response and follow-up workflow: incoming leads are classified, a first-response draft is generated, and the right agent or coordinator is notified with context.',
        bullets: [
          'Fast lead response without losing voice consistency',
          'Reusable property and neighborhood knowledge',
          'Clear review checkpoints before anything customer-facing is sent'
        ]
      },
      {
        heading: 'How the course maps to this industry',
        body:
          'The course gives real estate teams a practical path from prompt design to workflow rollout so they can pilot one process, measure response speed, and expand only after quality is stable.'
      }
    ]
  },
  {
    slug: 'e-commerce',
    title: 'AI Integration for E-commerce',
    eyebrow: 'Industry Workflow',
    description:
      'AI integration strategies for e-commerce brands: support triage, merchandising content, return workflows, review analysis, and operational reporting.',
    summary:
      'E-commerce teams get leverage from AI when they shorten response time, reduce repetitive support load, and keep merchandising and operations synced.',
    audience: 'DTC founders, support leaders, merchandising teams, and e-commerce operators.',
    keywords: ['AI for e-commerce', 'AI integration e-commerce support', 'e-commerce automation AI'],
    workflows: [
      'Order-status and returns support automation',
      'Review clustering and product insight extraction',
      'Merchandising copy generation with approval workflow',
      'Ops reporting from store, ads, and support data'
    ],
    sections: [
      {
        heading: 'The fastest e-commerce wins',
        body:
          'Support and merchandising are usually the best starting points because the work is repetitive, measurable, and already documented. AI can reduce handling time while preserving human review for exceptions.'
      },
      {
        heading: 'Automation guardrails that matter',
        body:
          'Customer-facing automation should be grounded in real order state, shipping rules, and return policies. That is why retrieval, tool validation, and exception handling matter more than flashy prompts.',
        bullets: [
          'Use order data as a retrieval or tool source, not just prompt context.',
          'Escalate edge cases like damaged goods and chargebacks.',
          'Track CSAT, handle time, and refund error rate after launch.'
        ]
      },
      {
        heading: 'How the course helps operators ship',
        body:
          'The course focuses on workflow architecture, review loops, and implementation checklists so e-commerce teams can launch one controlled automation at a time and avoid support quality regressions.'
      }
    ]
  },
  {
    slug: 'law-firms',
    title: 'AI Integration for Law Firms',
    eyebrow: 'Industry Workflow',
    description:
      'AI integration opportunities for law firms: intake triage, document summarization, knowledge retrieval, internal drafting support, and client update workflows.',
    summary:
      'Law firms benefit from AI when repetitive intake and document workflows are standardized with human review, traceability, and clear limits on what the model is allowed to do.',
    audience: 'Law firm operators, practice leaders, intake teams, and legal ops professionals.',
    keywords: ['AI for law firms', 'legal workflow automation AI', 'AI integration law firms'],
    workflows: [
      'Client intake classification and routing',
      'Internal case summary generation',
      'Knowledge retrieval from firm-approved materials',
      'Status-update drafting with attorney review'
    ],
    sections: [
      {
        heading: 'Where AI fits safely',
        body:
          'Legal teams should think of AI as a drafting, summarization, and retrieval layer under professional review, not as an unsupervised advice engine. The safest pilots are internal workflows with clear approval gates.'
      },
      {
        heading: 'Implementation rules that matter',
        body:
          'A law-firm workflow needs stricter guardrails than a generic content tool. Every deployment should define approved data sources, review ownership, and escalation rules before anything touches a client communication.',
        bullets: [
          'Keep confidential data access explicit and auditable.',
          'Constrain outputs to summaries, drafts, and classifications.',
          'Require attorney review for client-facing or legal interpretation steps.'
        ]
      },
      {
        heading: 'How the course supports adoption',
        body:
          'The curriculum is useful for legal ops teams because it breaks automation into system components: prompt design, retrieval, tool use, validation, and review, all anchored to real operational risks.'
      }
    ]
  }
];
