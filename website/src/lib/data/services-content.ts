export interface ServiceStep {
  title: string
  body: string
}

export interface ServiceDetail {
  slug: string
  name: string
  navName: string
  summary: string
  overview: string
  involves: {
    lead: string
    items?: string[]
    note?: string
  }
  whatWeDo: ServiceStep[]
  deliverables: string[]
  timeline?: {
    headline: string
    lead: string
    note?: string
  }
  whyUs?: {
    eyebrow: string
    title: string
    lead: string
    stats: { label: string; value: string }[]
  }
  faq: { q: string; a: string }[]
  relatedServicesIntro?: string
}

export const SERVICES_CONTENT: ServiceDetail[] = [
  {
    slug: 'erpnext-implementation',
    name: 'Frappe ERP implementation',
    navName: 'Frappe ERP implementation',
    summary:
      'We implement ERPNext around the way your business works, from initial discovery and configuration through testing, training, and go live.',
    overview:
      'Techincglobal implements ERPNext around the way your business works. We start by understanding your processes, priorities, existing systems, and data, then configure the platform to support the work your teams actually do.\n\nWhere the standard platform does not meet a specific requirement, we can customize, develop, or integrate the solution rather than asking your teams to work around the system.',
    involves: {
      lead:
        'An ERP implementation is more than configuring software. The system needs to reflect how your business operates, the information your teams depend on, and the decisions that need to happen at each stage of a process.\n\nTechincglobal works with your teams to understand those requirements and translate them into an ERPNext solution covering the functions your business needs, including:',
      items: [
        'Accounting and finance',
        'Sales and customer management',
        'Purchasing',
        'Inventory and warehouses',
        'Manufacturing',
        'Projects',
        'Human resources',
        'Other business functions where required',
      ],
      note:
        'The implementation can cover multiple functions while still being delivered in defined stages. NXTGEN, our Agile implementation methodology, provides the structure for planning, configuring, developing, testing, training, and deploying each part of the solution.',
    },
    whatWeDo: [
      {
        title: 'Understand your business',
        body: 'We work with your process owners and key users to understand how work is done today, where information moves between teams, and where the current system or process creates problems.',
      },
      {
        title: 'Map and configure your processes',
        body: 'We map the processes that need to be supported and configure ERPNext around them. This includes workflows, roles, permissions, approval processes, and the settings needed for day-to-day operations.',
      },
      {
        title: 'Prepare and migrate your data',
        body: 'We assess your existing data, identify what needs to be cleaned or restructured, and plan how it will be mapped into ERPNext. The aim is to bring across the information your business needs without carrying unnecessary legacy data into the new system.',
      },
      {
        title: 'Develop what the standard platform does not cover',
        body: 'Not every business requirement can be met through standard configuration. Where necessary, we customize ERPNext, develop new functionality, or integrate it with other systems your business depends on.',
      },
      {
        title: 'Test with your teams',
        body: 'Your users are involved in user acceptance testing and, where appropriate, parallel running. This gives your teams the opportunity to test real processes and data before go live and gives us the opportunity to address issues before deployment.',
      },
      {
        title: 'Prepare your people',
        body: 'Training is based on the processes your teams will actually use. We help users understand how their work fits into the new system and provide the documentation and knowledge they need to work with it.',
      },
      {
        title: 'Deploy and support the transition',
        body: 'Once the solution and users are ready, we move through go live and provide the support needed during the transition. We continue to work with you after deployment as the system settles into day-to-day use.',
      },
    ],
    deliverables: [
      'Process discovery and mapping',
      'Gap analysis and solution design',
      'ERPNext module configuration',
      'Workflow and approval design',
      'Roles, permissions, and access controls',
      'Master data preparation and migration',
      'Customization and development where required',
      'Integration with existing systems where required',
      'User acceptance testing (UAT)',
      'Parallel running where appropriate',
      'Role-based user training',
      'Go-live planning and deployment',
      'Post-go-live support',
    ],
    timeline: {
      headline: 'How long does an ERPNext implementation take?',
      lead:
        "Techincglobal's standard NXTGEN implementation programme is planned around a 12-week delivery model. Actual timelines depend on the number of business functions involved, the complexity of the processes, data preparation, integrations, custom development, and the availability of your team.",
      note:
        'Most implementations fall within a 10 to 16 week range, but we determine the appropriate timeline based on the actual scope rather than forcing every business into the same schedule.',
    },
    whyUs: {
      eyebrow: 'WHY US',
      title: 'Why Techincglobal?',
      lead:
        'Techincglobal combines ERPNext implementation expertise with local knowledge of how Sri Lankan businesses operate. As the only official Frappe partner in Sri Lanka and a Certified Bronze Partner, we understand both the platform and the practical realities of putting it to work.',
      stats: [
        { label: 'DELIVERY', value: '12-week standard programme' },
        { label: 'METHODOLOGY', value: 'NXTGEN Agile, up to 40% faster' },
        { label: 'EXPERIENCE', value: '30+ ERP implementations' },
        { label: 'HAPPY CUSTOMERS', value: 'Long-term customer relationships' },
      ],
    },
    faq: [
      {
        q: 'Does ERPNext replace all our existing systems?',
        a: 'Not necessarily. Techincglobal first assesses the systems your business already uses and determines what should remain, what should integrate with ERPNext, and what can be replaced as part of the implementation.',
      },
      {
        q: 'Can ERPNext be customized for our business?',
        a: 'Yes. We start with standard ERPNext functionality and configure it around your requirements wherever possible. Where a business requirement goes beyond the standard platform, Techincglobal can customize or develop the required functionality.',
      },
      {
        q: 'Can you migrate data from our existing ERP?',
        a: 'Yes. We assess the existing data, determine what needs to be retained, clean and structure it where necessary, and map it to the ERPNext data model before migration.',
      },
      {
        q: 'Can ERPNext integrate with our other systems?',
        a: 'Yes. Techincglobal can integrate ERPNext with existing business systems such as banking, payment gateways, point of sale (POS), e-commerce, payroll, logistics, and other applications. The approach depends on the systems involved and may use APIs, webhooks, or scheduled data synchronization.',
      },
      {
        q: 'Do we have to implement every ERPNext module at once?',
        a: 'No. The implementation can be planned around your business priorities. NXTGEN allows functions and business areas to be delivered in defined stages rather than requiring everything to go live at the same time.',
      },
      {
        q: 'How involved does our team need to be?',
        a: "Your team's involvement is essential. Process owners and key users help us understand how the business works, review the configured solution, test it, and prepare for go live. Their involvement helps ensure that the system reflects the actual business rather than assumptions made during the project.",
      },
      {
        q: 'What happens after go live?',
        a: 'Techincglobal continues to support the system after deployment. We help resolve issues, support your teams, and make further changes as your business requirements develop.',
      },
    ],
    relatedServicesIntro:
      'An ERP implementation can involve more than configuring the standard platform. Depending on your requirements, Techincglobal can also customize ERPNext, automate business processes, modernize existing systems, and connect ERPNext with the systems you already use.',
  },
  {
    slug: 'frappe-customization-development',
    name: 'Frappe customization and development',
    navName: 'Frappe customization and development',
    summary:
      'When the standard platform does not cover a specific business requirement, we extend ERPNext with custom functionality built around your processes.',
    overview:
      'Techincglobal extends ERPNext when your business needs functionality that is not covered by the standard platform. We first look at what can be handled through configuration, then develop custom functionality where a specific requirement calls for something more.\n\nOur customizations are built using Frappe Framework and designed to remain maintainable as your ERPNext system evolves.',
    involves: {
      lead:
        'ERPNext provides a broad set of business functions, but no standard ERP can cover every way a business works. You may have a process that is specific to your industry, a workflow that needs additional steps, information that needs to be captured differently, or a system that ERPNext needs to exchange data with.\n\nTechincglobal works with your team to understand the requirement and determine the right approach. Where standard configuration is enough, we configure it. Where it is not, we extend ERPNext with custom functionality built around your processes.\n\nThis can include:',
      items: [
        'Custom applications and related documentation (DocTypes)',
        'Custom workflows and business logic',
        'Server-side and client-side scripting',
        'Custom reports and dashboards',
        'Custom print formats',
        'REST API and webhook integrations',
        'Custom user interfaces and forms',
        'Extensions to existing ERPNext functionality',
      ],
    },
    whatWeDo: [
      {
        title: 'Understand the requirement',
        body: 'We start with the business need rather than jumping straight into development. We work with your team to understand the process, the people involved, the information that needs to be captured, and what the system needs to do.',
      },
      {
        title: 'Check what ERPNext already provides',
        body: 'Not every requirement needs custom development. We first look at the standard ERPNext functionality and available configuration options so that custom code is used where it adds real value.',
      },
      {
        title: 'Design the solution',
        body: 'Where development is required, we determine how the functionality should fit into your existing ERPNext setup. This includes the data model, workflows, permissions, interfaces, and how the new functionality interacts with other parts of the system.',
      },
      {
        title: 'Develop custom functionality',
        body: 'We develop custom Frappe applications, DocTypes, scripts, reports, dashboards, print formats, and other functionality based on the agreed requirements.',
      },
      {
        title: 'Integrate with other systems',
        body: 'Where your process depends on another application, we can connect the custom functionality with existing systems through APIs, webhooks, or other appropriate integration methods.',
      },
      {
        title: 'Test with your team',
        body: 'Custom functionality needs to work in the context of the wider ERP system. We test the development and work with your users to verify that it supports the actual business process before deployment.',
      },
      {
        title: 'Maintain and extend',
        body: 'We use version control and maintainable development practices so that custom functionality can be managed as part of your ERPNext environment and updated as the platform evolves.',
      },
    ],
    deliverables: [
      'Custom Frappe applications and DocTypes',
      'Custom workflows and business logic',
      'Server-side and client-side scripting',
      'Custom reports and dashboards',
      'Custom print formats',
      'REST API and webhook integrations',
      'Custom forms and user interfaces',
      'Version-controlled development',
      'Testing and deployment support',
      'Documentation where required',
    ],
    faq: [
      {
        q: 'When do we need customization instead of configuration?',
        a: 'We first look at what can be achieved through standard ERPNext configuration. Custom development is considered when the requirement cannot be reasonably supported through the standard functionality or configuration options.',
      },
      {
        q: 'Can you customize an existing ERPNext implementation?',
        a: 'Yes. Techincglobal can assess an existing ERPNext setup, understand how it has been configured and customized, and develop or improve functionality where required.',
      },
      {
        q: 'Will customizations affect future ERPNext upgrades?',
        a: 'Custom development needs to be designed with upgrades in mind. Techincglobal develops custom functionality as maintainable Frappe applications rather than modifying the ERPNext core wherever possible. This helps keep custom functionality separate from the standard platform and makes future upgrades easier to manage.',
      },
      {
        q: 'Can you develop a completely new application?',
        a: 'Yes. Where a requirement goes beyond extending ERPNext, Techincglobal can develop custom Frappe applications and integrate them with the wider ERPNext environment.',
      },
      {
        q: 'Can custom functionality integrate with our existing systems?',
        a: 'Yes. Custom functionality can connect with other applications through REST APIs, webhooks, and other integration methods, depending on the systems involved.',
      },
      {
        q: 'Can you work with our existing developers?',
        a: 'Yes. We can work alongside your internal development team or other technology partners, depending on the scope and requirements.',
      },
      {
        q: 'Can you customize ERPNext for industry-specific processes?',
        a: 'Yes. Techincglobal can extend ERPNext to support processes that are specific to an industry or individual business, while keeping the standard ERPNext functionality where it already meets the requirement.',
      },
    ],
  },
  {
    slug: 'business-process-automation',
    name: 'Business process automation',
    navName: 'Business process automation',
    summary:
      'We identify repetitive work and manual handoffs that can be handled within the system, then build workflows and automation that reduce the work involved.',
    overview:
      'Techincglobal helps businesses reduce repetitive manual work by automating the steps that can be handled by the system. We look at how information moves through your processes, identify where people are spending time on routine tasks or manual handoffs, and build workflows and automation around those points.\n\nThe aim is not to automate for the sake of it. We automate the parts of a process where the system can do the work reliably, while keeping people involved where their judgment or approval is needed.',
    involves: {
      lead:
        'Many business processes depend on people moving information from one place to another, sending an email when something needs approval, checking whether a task has been completed, or creating the same document again and again.\n\nTechincglobal maps these processes and identifies the steps that can be handled automatically within ERPNext and connected systems.\n\nAutomation can include:',
      items: [
        'Approval workflows and escalation paths',
        'Automated notifications and reminders',
        'Scheduled and event-driven jobs',
        'Automatic document generation and distribution',
        'Data updates between connected processes',
        'Exception reporting and alerts',
      ],
    },
    whatWeDo: [
      {
        title: 'Understand the process',
        body: 'We start by looking at how the process works today. We identify the people involved, the decisions that need to be made, the information that moves between steps, and where manual work is taking place.',
      },
      {
        title: 'Identify what can be automated',
        body: 'Not every step should be automated. We look for repetitive tasks, manual data entry, routine notifications, approval delays, and other steps where the system can reliably take over the work.',
      },
      {
        title: 'Design the workflow',
        body: 'We define how the process should move through the system, including approvals, conditions, notifications, escalations, and the points where a person needs to make a decision.',
      },
      {
        title: 'Build the automation',
        body: 'We configure ERPNext workflows and develop the required automation using the appropriate Frappe functionality. Where another system is involved, we can connect the process through an integration rather than creating another manual handoff.',
      },
      {
        title: 'Handle exceptions',
        body: 'Good automation also needs to know when something does not go as expected. We can build notifications, alerts, and exception reporting so that unusual cases are brought to the attention of the right people rather than being lost in an automated process.',
      },
      {
        title: 'Test with the people who use it',
        body: 'We test automated processes with the teams who work with them every day. This helps verify that the workflow reflects the real business process and that people know when they need to act.',
      },
      {
        title: 'Monitor and improve',
        body: 'Business processes change. We can review existing automation and make changes as requirements develop, new systems are introduced, or teams find better ways of working.',
      },
    ],
    deliverables: [
      'Workflow and approval chain design',
      'Automated notifications and reminders',
      'Escalation workflows',
      'Scheduled and event-driven jobs',
      'Automated document generation and distribution',
      'Process-based data updates',
      'Exception reporting and alerts',
      'Integration triggers between connected systems',
      'Testing and deployment support',
      'Documentation where required',
    ],
    faq: [
      {
        q: 'What kinds of business processes can be automated?',
        a: 'Processes involving repetitive tasks, approvals, notifications, document generation, scheduled activities, and routine data updates are often good candidates for automation. We assess the process first rather than assuming that every manual step should be automated.',
      },
      {
        q: 'Does automation mean removing people from the process?',
        a: 'No. Automation can handle repetitive steps while keeping people involved where decisions, approvals, or exceptions require human judgment. The objective is to reduce unnecessary manual work, not remove people from processes that need them.',
      },
      {
        q: 'Can you automate processes that involve more than ERPNext?',
        a: 'Yes. Where a process involves other business systems, Techincglobal can connect the automation to those systems through appropriate integrations. This can reduce the need for people to manually move information between applications.',
      },
      {
        q: 'Can existing ERPNext workflows be automated?',
        a: 'Yes. Techincglobal can review an existing ERPNext setup and extend its workflows and automation where the standard configuration does not cover the required process.',
      },
      {
        q: 'Can approval processes be automated?',
        a: 'Yes. Approval workflows can be configured around roles, conditions, and business rules, with notifications and escalation steps where required.',
      },
      {
        q: 'What happens when an automated process encounters an exception?',
        a: 'Exceptions can be identified and brought to the attention of the appropriate person through notifications, alerts, or exception reports. The exact approach depends on the process and the type of exception being handled.',
      },
      {
        q: 'How do you decide what should be automated?',
        a: 'We look at the process as a whole, including the effort involved, frequency of the task, potential for errors, dependencies on other systems, and where human decisions are needed. Automation should make the process work better, not simply make it more complicated.',
      },
      {
        q: 'Can you improve automation that someone else has already built?',
        a: 'Yes. Techincglobal can assess existing workflows and automation, understand how they fit into the wider ERPNext setup, and modify or extend them where required.',
      },
    ],
  },
  {
    slug: 'legacy-system-modernization',
    name: 'Legacy system modernization',
    navName: 'Legacy system modernization',
    summary:
      'We help businesses move away from older systems and fragmented processes, bringing their operations onto a modern ERP platform without losing the information they depend on.',
    overview:
      'Techincglobal helps businesses move away from older systems and fragmented processes by bringing their operations onto a modern ERP platform while preserving the information they need.\n\nWe assess the existing systems and data, plan the migration around the needs of the business, and manage the transition so your teams can move to the new system without losing the history they depend on.',
    involves: {
      lead:
        'Replacing an older system is not simply a matter of moving data from one database to another. Legacy systems often contain years of transactional history, customer and supplier records, financial information, and business data that still needs to be available after the new system goes live.\n\nTechincglobal assesses your existing systems and data, determines what needs to move into ERPNext, and develops a migration approach that preserves the information the business needs.\n\nWhere required, we can run the existing and new systems in parallel while data and processes are checked against each other. This gives your team an opportunity to identify and resolve differences before the legacy system is retired.',
    },
    whatWeDo: [
      {
        title: 'Assess your existing systems and data',
        body: 'We start by understanding what systems are currently in use, what information they contain, how that information is structured, and which parts need to be retained. This includes looking at data quality, duplication, missing information, and inconsistencies that may need to be addressed before migration.',
      },
      {
        title: 'Define the migration strategy',
        body: 'We determine what data should be migrated, what can be archived, how historical information should be structured, and how it will map to ERPNext. The migration plan is based on the business requirements rather than moving everything simply because it exists in the legacy system.',
      },
      {
        title: 'Clean and transform historical data',
        body: 'Legacy data often needs preparation before it can be used in a new system. We identify data that needs to be cleaned, transformed, consolidated, or mapped before loading it into ERPNext.',
      },
      {
        title: 'Migrate and reconcile the data',
        body: 'We load the prepared data into the new system and reconcile key records and transactions against the source system. Where differences are identified, we investigate them and resolve them before the migration is considered complete.',
      },
      {
        title: 'Run systems in parallel where required',
        body: 'For businesses that need additional assurance during the transition, we can support parallel running of the existing and new systems. This allows teams to compare results and identify issues before the legacy system is retired.',
      },
      {
        title: 'Prepare for decommissioning',
        body: 'Once the new system is ready and the required data has been migrated or archived, we help plan the retirement of the legacy system. This includes considering the historical information and records that still need to remain accessible.',
      },
      {
        title: 'Support the transition',
        body: 'Moving to a new system affects more than data. We work with your teams through testing, validation, and go-live so they understand the new processes and know where to find the information they need.',
      },
    ],
    deliverables: [
      'Legacy system and data assessment',
      'Data quality and gap analysis',
      'Migration strategy and reconciliation plan',
      'Historical data mapping and transformation',
      'Data migration and validation',
      'Parallel running where required',
      'Variance identification and resolution',
      'Data archiving planning',
      'Legacy system decommissioning plan',
      'Testing and deployment support',
      'Documentation where required',
    ],
    faq: [
      {
        q: 'Do we have to migrate all our historical data?',
        a: 'No. We first assess what information the business needs in the new system and what can be archived separately. The migration approach can preserve the historical information required for operational, financial, reporting, or other business needs without bringing unnecessary legacy data into ERPNext.',
      },
      {
        q: 'Can you migrate data from our existing ERP system?',
        a: 'Yes. Techincglobal can assess data from existing ERP and business systems, map it to the ERPNext data structure, transform it where necessary, and migrate the required information into the new system.',
      },
      {
        q: 'How do you make sure the migrated data is accurate?',
        a: 'We establish reconciliation checks between the source and target systems and validate the migrated data against agreed criteria. Where differences are identified, they are investigated and resolved before the migration is finalized.',
      },
      {
        q: 'What happens to our transactional history?',
        a: 'Transactional history can be migrated or archived depending on the business requirements and the condition and structure of the existing data. We determine the appropriate approach as part of the migration strategy.',
      },
      {
        q: 'Can we keep our existing system running while ERPNext is implemented?',
        a: 'Yes. Where the business requires it, the existing and new systems can be run in parallel for a defined period. This allows teams to compare processes and results before the legacy system is retired.',
      },
      {
        q: 'What if our legacy data is incomplete or inconsistent?',
        a: 'We identify data quality issues during the assessment and determine what needs to be cleaned, corrected, transformed, or excluded before migration. The condition of the existing data is taken into account when planning the migration effort.',
      },
      {
        q: 'Can you migrate data from more than one legacy system?',
        a: 'Yes. Where a business is consolidating information from multiple systems, we can assess the different data sources, determine how they should be mapped and consolidated, and plan the migration into a common ERPNext environment.',
      },
      {
        q: 'What happens to the old system after migration?',
        a: 'The legacy system does not necessarily need to remain operational indefinitely. Once the required information has been migrated or archived and the new system is validated, Techincglobal can help plan the decommissioning of the old system while considering any ongoing access or record-keeping requirements.',
      },
      {
        q: 'Can we move to ERPNext in stages?',
        a: 'Yes. A legacy modernization project can be planned in stages based on business priorities, data dependencies, and the readiness of different teams or functions. The appropriate approach depends on the existing systems and the scope of the transition.',
      },
    ],
  },
  {
    slug: 'system-integration',
    name: 'System integration',
    navName: 'System integration',
    summary:
      'Your business already has systems that work. We connect ERPNext with them, so you can keep what you need while bringing the information together in one place.',
    overview:
      'Your business already has systems that work. Techincglobal connects ERPNext with them, so you can keep the systems you need while bringing the information together across your business.\n\nWe design and build integrations around the systems involved, whether they exchange information through APIs, webhooks, scheduled synchronization, or file-based transfers.',
    involves: {
      lead:
        'ERPNext rarely operates on its own. Your business may already depend on banking systems, payment gateways, point of sale (POS) systems, e-commerce platforms, logistics providers, or other applications.\n\nTechincglobal connects these systems so that information can move between them without relying on people to copy data from one system to another.\n\nWe first understand what information needs to move, when it needs to move, which system is responsible for it, and what should happen when something goes wrong. We then design the integration around the systems and interfaces available.',
    },
    whatWeDo: [
      {
        title: 'Understand your systems',
        body: 'We start by looking at the systems involved, the information they hold, and how your teams currently move information between them. This helps us understand both the technical interfaces and the business process behind the integration.',
      },
      {
        title: 'Define what needs to move',
        body: 'An integration is not simply about connecting two systems. We determine which data needs to be exchanged, in which direction, when it should move, and how the receiving system should use it.',
      },
      {
        title: 'Design the integration',
        body: 'We select the appropriate integration approach based on the systems involved. This may include REST APIs, webhooks, scheduled synchronization, or file-based data exchange where that is the interface supported by the system or vendor.',
      },
      {
        title: 'Build the connection',
        body: 'We develop the integration and configure the systems involved so that information can move between ERPNext and the connected applications as required.',
      },
      {
        title: 'Handle errors and retries',
        body: 'Integrations can fail for many reasons, from a temporary service interruption to invalid data or an unavailable endpoint. We build appropriate error handling and retry mechanisms so that failures do not simply become missing information.',
      },
      {
        title: 'Monitor what is happening',
        body: 'An integration needs to be visible after it is deployed. Where required, we provide monitoring and failure alerts so that the appropriate people know when an integration needs attention.',
      },
      {
        title: 'Test with real processes',
        body: 'We test the integration using the business processes and data it is expected to handle. This helps verify not only that systems can exchange information, but that the information reaches the right place and supports the intended process.',
      },
    ],
    deliverables: [
      'Integration architecture and interface design',
      'REST API integrations',
      'Webhook integrations',
      'Scheduled data synchronization',
      'File-based data exchange',
      'Banking and payment gateway integrations',
      'Point of sale (POS) integrations',
      'E-commerce and marketplace integrations',
      'Logistics and courier integrations',
      'Error handling and retry mechanisms',
      'Integration monitoring and failure alerts',
      'Testing and deployment support',
      'Documentation where required',
    ],
    faq: [
      {
        q: 'Can ERPNext connect to the systems we already use?',
        a: 'Yes. Techincglobal can connect ERPNext with existing business systems where the required interface or integration method is available. We assess the systems involved and determine the appropriate approach.',
      },
      {
        q: 'Do we have to replace our existing systems?',
        a: 'No. Integration can allow you to keep systems that already work for your business while connecting them to ERPNext. We look at what should stay, what should connect, and where replacing a system may actually make sense.',
      },
      {
        q: 'What types of systems can you integrate with ERPNext?',
        a: 'The approach depends on the systems involved. Techincglobal can integrate ERPNext with systems such as banks, payment gateways, point of sale (POS), e-commerce, marketplaces, logistics and courier platforms, and other business applications.',
      },
      {
        q: 'How do systems exchange information?',
        a: 'The method depends on what the systems and vendors support. Integrations may use REST APIs, webhooks, scheduled synchronization, or file-based data exchange.',
      },
      {
        q: 'What happens if an integration fails?',
        a: 'We design integrations with error handling and retry mechanisms where appropriate. Failures can also be surfaced through monitoring and alerts so that they can be investigated rather than becoming a silent gap in your data.',
      },
      {
        q: 'Can information move in both directions?',
        a: 'Yes, where the systems and interfaces support it. An integration can be designed to send information from ERPNext to another system, receive information into ERPNext, or exchange information in both directions.',
      },
      {
        q: 'Can you integrate more than two systems?',
        a: 'Yes. Techincglobal can design integrations involving multiple systems where the business process requires information to move between ERPNext and several other applications.',
      },
      {
        q: 'Can you integrate with a system that does not have an API?',
        a: 'Possibly. The available options depend on what the system or vendor supports. Where an API is not available, file-based exchange or scheduled data transfers may provide an alternative.',
      },
      {
        q: 'How do you make sure the integration is reliable?',
        a: 'We design the integration around the data and process requirements, test it against real use cases, and include appropriate error handling, retries, and monitoring. The exact approach depends on the systems being connected and the importance of the data being exchanged.',
      },
      {
        q: 'Can you work with our existing IT team or software vendors?',
        a: 'Yes. Techincglobal can work with your internal IT team and the vendors responsible for the connected systems to understand their interfaces, coordinate integration requirements, and resolve technical dependencies.',
      },
    ],
  },
  {
    slug: 'erp-consulting-advisory',
    name: 'ERP consulting and advisory',
    navName: 'ERP consulting and advisory',
    summary:
      'Not every ERP decision starts with an implementation. We help businesses assess their requirements, understand what ERPNext can do, and decide how best to approach their digital transformation.',
    overview:
      'Not every ERP decision starts with an implementation. Techincglobal helps businesses understand what they need, assess whether ERPNext is a good fit, and decide what the right next step looks like.\n\nSometimes that means preparing for an ERP implementation. Sometimes it means changing a process, improving an existing system, or waiting until the business is ready. We help you understand the difference before you commit to a major system change.',
    involves: {
      lead:
        'An ERP decision affects more than the software. It can change business processes, roles, data, integrations, reporting, and the way teams work every day.\n\nTechincglobal works with your business to understand the problems you are trying to solve, assess your current systems and processes, and determine what an ERP platform needs to do for you.\n\nWe can help you evaluate ERPNext, define the scope of a potential implementation, compare alternatives, understand the likely costs, and develop a practical roadmap for moving forward.',
    },
    whatWeDo: [
      {
        title: 'Understand your current situation',
        body: 'We start with where you are today. We look at your existing systems, business processes, data, pain points, and the reasons you are considering a change.',
      },
      {
        title: 'Define what the business actually needs',
        body: 'We work with the people involved to identify the requirements that matter to the business. This helps separate essential capabilities from preferences and avoids building a solution around assumptions.',
      },
      {
        title: 'Assess ERPNext fit',
        body: 'We assess your requirements against the standard ERPNext platform and identify where configuration, customization, development, or integration may be needed.',
      },
      {
        title: 'Evaluate your options',
        body: 'ERPNext may be the right fit, but it may not be the only option. We can help you evaluate platforms and approaches against your business requirements, existing technology environment, priorities, and budget.',
      },
      {
        title: 'Understand the likely investment',
        body: 'We help you consider the costs involved in an ERP decision, including implementation, customization, integration, data migration, training, support, and ongoing operation.',
      },
      {
        title: 'Build a practical roadmap',
        body: 'Once the direction is clear, we help define what should happen next. This can include implementation phases, priorities, dependencies, timelines, and the resources your business will need to contribute.',
      },
      {
        title: 'Challenge the assumption when necessary',
        body: 'Sometimes the problem is not the software. It may be a process that needs to change, data that needs attention, or a business that simply is not ready for an ERP implementation. We will tell you when that is the case.',
      },
    ],
    deliverables: [
      'ERP readiness and fit assessment',
      'Business and process requirements definition',
      'ERPNext fit and gap assessment',
      'Requirements definition and scope',
      'Total cost of ownership analysis',
      'Vendor and platform evaluation',
      'Implementation roadmap',
      'Business case development',
      'Technology and integration considerations',
      'Recommendations for next steps',
    ],
    faq: [
      {
        q: 'Do we need to be ready to implement ERP before talking to you?',
        a: 'No. Consulting can be useful before you have decided to implement anything. We can help you understand your options, identify what needs to be addressed first, and determine whether the timing is right.',
      },
      {
        q: 'How do we know whether ERPNext is right for our business?',
        a: 'We start with your requirements rather than assuming that ERPNext is the answer. We assess your business processes, systems, priorities, and requirements against what ERPNext provides and identify where additional development or integration may be needed.',
      },
      {
        q: 'What if our current system is good enough?',
        a: 'Then replacing it may not be the right decision. We can help assess whether the problems you are experiencing come from the system itself, how it is configured, or the processes around it.',
      },
      {
        q: 'Can you tell us if we are not ready for ERP?',
        a: 'Yes. ERP implementation requires time, people, preparation, and a clear reason for making the change. If the business needs to address its processes, data, internal ownership, or other areas first, we will identify those considerations.',
      },
      {
        q: 'Can you help us compare ERP platforms?',
        a: 'Yes. We can help define the criteria that matter to your business and assess platforms against those requirements. The evaluation can consider functionality, customization, integration, implementation requirements, costs, and your existing technology environment.',
      },
      {
        q: 'Can you help us define the scope before we speak to an implementation team?',
        a: 'Yes. We can work with your teams to document business requirements, identify the functions and processes that need to be covered, and develop an initial scope for the implementation.',
      },
      {
        q: 'What should we include when calculating the cost of an ERP?',
        a: 'The cost of an ERP decision extends beyond the software itself. Implementation, data migration, customization, integration, training, support, infrastructure, and ongoing maintenance may all need to be considered depending on the solution.',
      },
      {
        q: 'Can you develop an ERP implementation roadmap?',
        a: 'Yes. Once the requirements and priorities are understood, we can help define a phased roadmap covering the functions to be implemented, dependencies, priorities, timelines, and the involvement required from your teams.',
      },
      {
        q: 'Will Techincglobal recommend ERPNext even if another option is better suited?',
        a: 'Our assessment starts with your requirements. If ERPNext is not a good fit for what you need, we will explain why rather than recommending an implementation simply because it is the platform we work with.',
      },
    ],
  },
  {
    slug: 'support-optimization',
    name: 'Support and optimization',
    navName: 'Support and optimization',
    summary:
      'The work does not stop at go-live. We provide ongoing support and help businesses refine their ERPNext setup as their processes, requirements, and teams evolve.',
    overview:
      'The work does not stop at go-live. Techincglobal provides ongoing support for your ERPNext system and helps you keep it working as your business, processes, and teams change.\n\nFrom resolving day-to-day issues and managing version upgrades to improving performance and introducing additional modules, we continue working with you after implementation.',
    involves: {
      lead:
        'An ERP system becomes part of the way your business operates. Once it is live, your teams depend on it every day, your business requirements continue to change, and the platform itself continues to evolve.\n\nTechincglobal provides ongoing support to help you manage those changes. We track support requests against the agreed SLA, help maintain and upgrade your ERPNext environment, investigate performance issues, and work with you on improvements as your needs develop.\n\nSupport can also include introducing additional ERPNext functionality in stages, so the system can grow with the business rather than requiring everything to be implemented at once.',
    },
    whatWeDo: [
      {
        title: 'Handle day-to-day support',
        body: 'We provide ongoing support for issues that arise during normal use of your ERPNext system. Support requests are tracked through our helpdesk and handled according to the agreed SLA.',
      },
      {
        title: 'Manage version upgrades',
        body: 'ERPNext and Frappe Framework continue to evolve. We help plan and manage version upgrades, including the testing needed to make sure your existing processes and custom functionality continue to work as expected.',
      },
      {
        title: 'Test after changes',
        body: 'Changes to an ERP system can affect other parts of the business. We carry out regression testing where required to identify issues before changes are introduced into the production environment.',
      },
      {
        title: 'Investigate performance issues',
        body: 'When a system becomes slower or a process takes longer than it should, we investigate the underlying cause. This can include reviewing database performance, system configuration, and processes that may be affecting response times.',
      },
      {
        title: 'Introduce additional modules',
        body: 'Your business does not have to implement every ERPNext function at once. As your teams become comfortable with the system and new requirements emerge, we can introduce additional modules and functionality in defined stages.',
      },
      {
        title: 'Review how the system is being used',
        body: 'Over time, business processes change and teams may find better ways to use the system. We can review the existing setup, identify areas that could be improved, and recommend practical changes.',
      },
      {
        title: 'Continue improving the system',
        body: 'Optimization is an ongoing process. We work with your teams to identify improvements that make sense for the business and help implement them as priorities change.',
      },
    ],
    deliverables: [
      'SLA-backed support with tracked tickets',
      'ERPNext and Frappe Framework version upgrades',
      'Regression testing',
      'Database and performance optimization',
      'Troubleshooting and issue resolution',
      'Phased rollout of additional modules',
      'ERPNext configuration improvements',
      'Ongoing process reviews',
      'Documentation where required',
    ],
    faq: [
      {
        q: 'What does ongoing ERPNext support include?',
        a: 'Support can include troubleshooting day-to-day issues, investigating system problems, assisting users, managing upgrades, and making changes to the ERPNext setup as requirements develop. The exact scope depends on the agreed support arrangement.',
      },
      {
        q: 'How are support requests handled?',
        a: 'Support requests are raised through the helpdesk and tracked against the agreed SLA. This gives both your team and Techincglobal a record of the request and its progress.',
      },
      {
        q: 'Can you support an ERPNext system you did not implement?',
        a: 'Yes. Techincglobal can assess an existing ERPNext environment, understand its configuration and customizations, and provide support based on the condition and requirements of the system.',
      },
      {
        q: 'How do you handle ERPNext version upgrades?',
        a: 'We assess the existing environment, identify customizations and other areas that may be affected, plan the upgrade, and carry out appropriate testing before the updated version is deployed.',
      },
      {
        q: 'Will our customizations continue to work after an upgrade?',
        a: 'Custom functionality needs to be considered as part of an upgrade. Techincglobal reviews existing customizations and carries out regression testing where required to identify and address compatibility issues.',
      },
      {
        q: 'Can you improve the performance of our ERPNext system?',
        a: 'Yes. We can investigate performance issues and assess areas such as database performance, system configuration, and processes that may be affecting the system.',
      },
      {
        q: 'Do we have to implement additional ERPNext modules immediately?',
        a: 'No. Additional modules can be introduced in stages based on your business priorities and the readiness of your teams. We can help determine what should be introduced next and when.',
      },
      {
        q: 'How often should we review our ERPNext setup?',
        a: 'There is no single schedule that suits every business. Regular reviews can help identify changes in processes, new requirements, unused functionality, and areas where the system could be improved. Techincglobal can work with you to establish an appropriate review cycle.',
      },
      {
        q: 'Can Techincglobal help us as our business grows?',
        a: 'Yes. As your business changes, we can support changes to processes, configurations, integrations, custom functionality, and additional ERPNext modules as required.',
      },
      {
        q: 'What happens if we need something that ERPNext does not currently do?',
        a: 'We first assess whether the requirement can be addressed through standard configuration. Where it cannot, Techincglobal can consider customization, development, or integration with another system depending on the requirement.',
      },
    ],
  },
  {
    slug: 'training-change-management',
    name: 'Training and change management',
    navName: 'Training and change management',
    summary:
      'We train teams on their own processes and data, helping them get comfortable with the new system and use it effectively from day one.',
    overview:
      'Techincglobal trains your teams on the processes they will actually use in ERPNext, using your own workflows and data wherever possible. We help people understand how their work fits into the new system, build the knowledge they need before go-live, and continue supporting adoption after deployment.\n\nTraining is not something we leave until the end of the implementation. We involve the people who will use the system throughout the project so they have an opportunity to understand, test, and become familiar with the new way of working.',
    involves: {
      lead:
        'An ERP system changes how people do their work. New screens, workflows, approval processes, and responsibilities can take time to become familiar, particularly when teams have relied on spreadsheets, manual processes, or different systems for years.\n\nTechincglobal plans training around the roles, processes, and responsibilities of your teams. We use your own business context where appropriate, so users learn how the system applies to the work they actually do rather than working through generic examples.\n\nChange management also helps the business prepare for the transition, communicate what is changing, and identify where additional support may be needed after go-live.',
    },
    whatWeDo: [
      {
        title: 'Understand who needs to learn what',
        body: 'Different people use different parts of an ERP system. We identify the roles involved, the processes they need to perform, and the level of knowledge each group needs before go-live.',
      },
      {
        title: 'Train people on their actual work',
        body: 'We provide role-based training using your business processes and, where appropriate, your own data. This helps users understand not only which buttons to click, but how their work moves through the wider business process.',
      },
      {
        title: 'Document your processes',
        body: 'Training is more useful when people have something to refer back to. We document relevant workflows, procedures, and system-specific instructions so teams have a reference they can use after training.',
      },
      {
        title: 'Develop internal champions',
        body: 'Every business needs people who understand the system well enough to help others. We work with selected users to develop internal champions or super-users who can answer common questions, support their teams, and help reinforce the new way of working.',
      },
      {
        title: 'Prepare people for the change',
        body: 'We help communicate what is changing, why the change is being made, and what people need to do differently. This can include training plans, change communications, and preparation activities leading up to go-live.',
      },
      {
        title: 'Support the transition to go-live',
        body: 'Training does not end when the system is deployed. We support users during the transition and help identify areas where additional guidance or clarification is needed.',
      },
      {
        title: 'Track adoption and identify gaps',
        body: 'After go-live, we can review how the system is being used, identify areas where teams may be struggling, and recommend further training, documentation, or process changes where needed.',
      },
    ],
    deliverables: [
      'Role-based training programmes',
      'Training based on your business processes and data',
      'Client-specific documentation and SOPs',
      'Internal champion and super-user development',
      'Change communication planning',
      'Go-live training and transition support',
      'Post-go-live adoption tracking',
      'Refresher training where required',
      'Training and process documentation',
    ],
    faq: [
      {
        q: 'When does ERPNext training start?',
        a: 'Training is planned as part of the implementation rather than being left until the end. Users need to understand the processes they will follow, test the system, and become familiar with their roles before go-live.',
      },
      {
        q: 'Is the training the same for everyone?',
        a: 'No. Training is based on the roles and processes of the people using the system. Finance users, warehouse teams, sales staff, production users, managers, and administrators may all need different training.',
      },
      {
        q: 'Will training use our own data?',
        a: 'Where appropriate, yes. Using your own processes and representative data helps users understand how ERPNext applies to their actual work.',
      },
      {
        q: 'Do you provide documentation after training?',
        a: 'Yes. Techincglobal can provide client-specific documentation covering relevant processes, workflows, and system procedures. The documentation can also serve as a reference for new or existing users after go-live.',
      },
      {
        q: 'What is an internal champion or super-user?',
        a: 'An internal champion or super-user is someone within your organization who develops a deeper understanding of the system and can support other users. We help these people build the knowledge they need to answer common questions and help their teams use the system.',
      },
      {
        q: 'How do you help people who are resistant to the change?',
        a: 'We start by understanding the concerns behind the resistance. Clear communication, involvement in the implementation, practical training, and giving people an opportunity to work with the system before go-live can all help teams understand the change and adapt to it.',
      },
      {
        q: 'What happens if users need more training after go-live?',
        a: 'That is normal. People often identify questions or areas where they need additional guidance once they begin using the system in their day-to-day work. Techincglobal can provide refresher training and additional support where required.',
      },
      {
        q: 'How do you know whether people are actually using the system?',
        a: 'We can review system usage, support requests, user feedback, and other relevant indicators to identify areas where adoption may need attention. The approach depends on the system, the processes involved, and what the business needs to monitor.',
      },
      {
        q: 'Can you train our internal IT team as well?',
        a: 'Yes. Where required, training can include system administrators and technical users who need to understand configuration, administration, integrations, or other aspects of the ERPNext environment.',
      },
      {
        q: 'Can training continue as we add new ERPNext modules?',
        a: 'Yes. When additional modules or functionality are introduced, we can provide training and documentation for the affected teams so that people are prepared before the new functionality goes live.',
      },
    ],
  },
]
