/**
 * VINASTRA AEROSPACE — DATABASE & DATA MANAGEMENT ENGINE
 * Multi-entity transactional in-memory store with atomic JSON snapshotting.
 * Zero-dependency, Vercel-compatible (with /tmp fallback), and extensible.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { hashPassword } from './crypto.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const primaryDbPath = path.join(rootDir, 'data', 'db.json');
const fallbackDbPath = path.join('/tmp', 'vinastra_db.json');

class DatabaseEngine {
  constructor() {
    this.dbPath = primaryDbPath;
    this.isPersisting = false;
    this.needsPersist = false;
    this.data = {
      users: [],
      institutions: [],
      projects: [],
      projectMembers: [],
      tasks: [],
      researchSubmissions: [],
      engineeringReviews: [],
      documents: [],
      meetings: [],
      announcements: [],
      notifications: [],
      auditLogs: [],
      inquiries: [],
      passwordResets: []
    };
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    let loaded = false;
    
    // Try to load from JSON file first (local development)
    for (const testPath of [primaryDbPath, fallbackDbPath]) {
      try {
        const raw = await fs.readFile(testPath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          this.data = { ...this.data, ...parsed };
          this.dbPath = testPath;
          loaded = true;
          break;
        }
      } catch {
        // Continue to next path
      }
    }

    // If no data found, initialize with empty collections
    // DO NOT seed demo data - use real Firebase data
    if (!loaded) {
      console.log('[Database] No existing data found. Initialize with empty collections.');
      await this.persist();
    }

    this.initialized = true;
  }

  // Create initial admin user (for first-time setup)
  async createInitialAdmin() {
    const adminEmail = process.env.ADMIN_BOOTSTRAP_EMAIL || 'admin@vinastra.space';
    const adminPass = process.env.ADMIN_BOOTSTRAP_PASS || 'VinastraAdmin2026!';
    
    // Check if admin already exists
    const existing = this.data.users.find(u => u.email === adminEmail);
    if (existing) {
      console.log('[Database] Admin user already exists');
      return existing;
    }
    
    const { hash, salt } = hashPassword(adminPass);
    const now = new Date().toISOString();
    
    const adminUser = {
      id: crypto.randomBytes(16).toString('hex'),
      name: 'VINASTRA Admin',
      email: adminEmail,
      passwordHash: hash,
      salt: salt,
      role: 'ADMIN',
      institutionId: null,
      department: 'Executive Administration',
      status: 'ACTIVE',
      emailVerified: true,
      createdAt: now,
      updatedAt: now
    };
    
    this.data.users.push(adminUser);
    await this.persist();
    
    console.log('[Database] Initial admin user created:', adminEmail);
    return adminUser;
  }
  
  // DEPRECATED: Old seed function replaced with real data
  async seedInitialData() {
    console.warn('[Database] seedInitialData is deprecated. Use real Firebase data instead.');
    return;
    const adminPass = hashPassword('VinastraAdmin2026!');
    const engPass = hashPassword('Engineer2026!');
    const resPass = hashPassword('Research2026!');
    const stuPass = hashPassword('Student2026!');
    const invPass = hashPassword('Investor2026!');

    const now = new Date().toISOString();

    // 1. Seed Institutions
    const instHq = {
      id: 'inst-vinastra-hq',
      code: 'VIN-HQ',
      name: 'Vinastra Aerospace Operations & R&D Headquarters',
      domain: 'vinastra.space',
      type: 'INDUSTRY',
      status: 'ACTIVE',
      createdAt: now
    };
    const instIitb = {
      id: 'inst-iit-bombay',
      code: 'IITB-SRL',
      name: 'IIT Bombay — Space Robotics & Autonomous Systems Lab',
      domain: 'iitb.ac.in',
      type: 'UNIVERSITY',
      status: 'ACTIVE',
      createdAt: now
    };
    const instIsro = {
      id: 'inst-isro-track',
      code: 'ISRO-TRK',
      name: 'ISRO Space Applications & DeepTech Collaboration Track',
      domain: 'isro.gov.in',
      type: 'SPACE_AGENCY',
      status: 'ACTIVE',
      createdAt: now
    };

    // 2. Seed Users
    const uAdmin = {
      id: 'usr-admin-vinay',
      name: 'Vinay Jeedi',
      email: 'admin@vinastra.space',
      passwordHash: adminPass.hash,
      salt: adminPass.salt,
      role: 'ADMIN',
      institutionId: instHq.id,
      department: 'Executive Engineering & Foundational Leadership',
      status: 'ACTIVE',
      emailVerified: true,
      createdAt: now,
      updatedAt: now
    };

    const uEngineer = {
      id: 'usr-eng-vikram',
      name: 'Dr. Vikram Sarabhai',
      email: 'engineer@vinastra.space',
      passwordHash: engPass.hash,
      salt: engPass.salt,
      role: 'ENGINEER',
      institutionId: instHq.id,
      department: 'Robotics & Mechanical Kinematics Division',
      status: 'ACTIVE',
      emailVerified: true,
      createdAt: now,
      updatedAt: now
    };

    const uResearcher = {
      id: 'usr-res-sunita',
      name: 'Prof. Sunita Sharma',
      email: 'researcher@iitb.ac.in',
      passwordHash: resPass.hash,
      salt: resPass.salt,
      role: 'RESEARCHER',
      institutionId: instIitb.id,
      department: 'Aerospace Structural Dynamics & Novel Materials',
      status: 'ACTIVE',
      emailVerified: true,
      createdAt: now,
      updatedAt: now
    };

    const uStudent = {
      id: 'usr-stu-aarav',
      name: 'Aarav Patel',
      email: 'student@iitb.ac.in',
      passwordHash: stuPass.hash,
      salt: stuPass.salt,
      role: 'STUDENT',
      institutionId: instIitb.id,
      department: 'Autonomous Systems & Digital Twin Computing',
      status: 'ACTIVE',
      emailVerified: true,
      createdAt: now,
      updatedAt: now
    };

    const uInvestor = {
      id: 'usr-inv-rajesh',
      name: 'Rajesh Mehta',
      email: 'investor@aerospace-fund.co',
      passwordHash: invPass.hash,
      salt: invPass.salt,
      role: 'INVESTOR',
      institutionId: null,
      department: 'DeepTech Venture & Space Infrastructure Angels',
      status: 'ACTIVE',
      emailVerified: true,
      createdAt: now,
      updatedAt: now
    };

    // 3. Seed Projects
    const pProto1 = {
      id: 'prj-proto-1',
      code: 'ASCS-P1',
      title: 'ASCS Prototype-1: Ground Demonstrator Rig',
      description: 'Physical validation rig demonstrating blueprint-guided assembly, stereoscopic inspection, and corrective kinematics under simulated micro-tolerance conditions.',
      category: 'ROBOTICS',
      status: 'ACTIVE',
      phase: 'Phase 1: Conceptual Modeling & Simulation',
      leaderUserId: uEngineer.id,
      institutionId: instHq.id,
      confidentialityLevel: 'INTERNAL',
      budget: '₹85,00,000',
      createdAt: now,
      updatedAt: now
    };

    const pMetrology = {
      id: 'prj-metrology-vision',
      code: 'ASCS-VIS',
      title: 'Machine Vision & Metrology Sensor Array',
      description: 'Multi-camera sub-millimeter metrology system with localized edge computing for orbital surface reconstruction and defect classification.',
      category: 'METROLOGY',
      status: 'ACTIVE',
      phase: 'Phase 2: Sensor Calibration & Edge AI',
      leaderUserId: uResearcher.id,
      institutionId: instIitb.id,
      confidentialityLevel: 'INSTITUTIONAL',
      budget: '₹35,00,000',
      createdAt: now,
      updatedAt: now
    };

    const pFactory = {
      id: 'prj-factory-asf01',
      code: 'ASF-01',
      title: 'Modular Space Factory Architecture (ASF-01)',
      description: 'Comprehensive digital twin blueprint for long-term orbital manufacturing, feedstock recycling, and autonomous module docking.',
      category: 'FACTORY',
      status: 'PLANNING',
      phase: 'Phase 3: Digital Twin & Systems Integration',
      leaderUserId: uAdmin.id,
      institutionId: instHq.id,
      confidentialityLevel: 'INTERNAL',
      budget: '₹1,20,00,000',
      createdAt: now,
      updatedAt: now
    };

    // 4. Seed Project Members
    const members = [
      { id: 'pm-1', projectId: pProto1.id, userId: uAdmin.id, role: 'LEAD', joinedAt: now },
      { id: 'pm-2', projectId: pProto1.id, userId: uEngineer.id, role: 'CONTRIBUTOR', joinedAt: now },
      { id: 'pm-3', projectId: pProto1.id, userId: uStudent.id, role: 'CONTRIBUTOR', joinedAt: now },
      { id: 'pm-4', projectId: pMetrology.id, userId: uResearcher.id, role: 'LEAD', joinedAt: now },
      { id: 'pm-5', projectId: pMetrology.id, userId: uStudent.id, role: 'CONTRIBUTOR', joinedAt: now },
      { id: 'pm-6', projectId: pFactory.id, userId: uAdmin.id, role: 'LEAD', joinedAt: now },
      { id: 'pm-7', projectId: pFactory.id, userId: uEngineer.id, role: 'REVIEWER', joinedAt: now }
    ];

    // 5. Seed Tasks
    const tasks = [
      {
        id: 'tsk-01',
        projectId: pProto1.id,
        title: 'Calibrate 6-Axis Force-Torque Sensor for End-Effector',
        description: 'Verify force feedback readings across 0.05N to 50N range to ensure delicate structural docking without contact chatter.',
        assignedUserId: uEngineer.id,
        createdByUserId: uAdmin.id,
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        deadline: '2026-11-15T18:00:00Z',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'tsk-02',
        projectId: pMetrology.id,
        title: 'Dataset Collection: Carbon Composite Micro-Fractures',
        description: 'Prepare synthetic lighting simulations and high-resolution training images for edge classification inference.',
        assignedUserId: uStudent.id,
        createdByUserId: uResearcher.id,
        priority: 'MEDIUM',
        status: 'IN_PROGRESS',
        deadline: '2026-11-05T18:00:00Z',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'tsk-03',
        projectId: pFactory.id,
        title: 'Draft Thermal Management Specifications for ASF-01 Bay',
        description: 'Calculate radiative heat dissipation curves during sunlight-to-shadow orbital transition phases.',
        assignedUserId: uEngineer.id,
        createdByUserId: uAdmin.id,
        priority: 'HIGH',
        status: 'TODO',
        deadline: '2026-12-01T18:00:00Z',
        createdAt: now,
        updatedAt: now
      }
    ];

    // 6. Seed Research Submissions
    const submissions = [
      {
        id: 'sub-01',
        title: 'Latency-Tolerant Autonomous Sequence Planning for Space Assembly',
        abstract: 'Investigation of semi-autonomous execution algorithms operating under 2.5 to 4.0-second round-trip communication delays with ground mission telemetry.',
        methodology: 'Simulation in ROS2 Gazebo with stochastic latency injection and state-machine verification.',
        findings: 'Local waypoint validation with onboard edge vision reduces abort rates by 84% compared to direct remote teleoperation.',
        category: 'AUTONOMOUS_CONTROL',
        authorUserId: uStudent.id,
        institutionId: instIitb.id,
        projectId: pMetrology.id,
        status: 'UNDER_REVIEW',
        reviewerNotes: 'Strong methodology. Needs validation against thermal drift.',
        decisionByUserId: uResearcher.id,
        decisionAt: null,
        version: 1,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'sub-02',
        title: 'Thermal Cycle Durability of Recycled Continuous Filament Composites',
        abstract: 'Examining tensile degradation of continuous carbon-fiber feedstock processed through multi-pass additive extrusion in high-vacuum environments.',
        methodology: 'Thermal vacuum chamber cycling (-120°C to +130°C) over 500 simulated orbital passes.',
        findings: 'Inter-laminar shear stress remains within 91% of baseline when extrusion speed is modulated with thermal telemetry.',
        category: 'MATERIALS_SCIENCE',
        authorUserId: uResearcher.id,
        institutionId: instIitb.id,
        projectId: pProto1.id,
        status: 'APPROVED_FOR_NEXT_STAGE',
        reviewerNotes: 'Formally approved for test rig integration.',
        decisionByUserId: uAdmin.id,
        decisionAt: now,
        version: 2,
        createdAt: now,
        updatedAt: now
      }
    ];

    // 7. Seed Engineering Reviews
    const reviews = [
      {
        id: 'rev-01',
        projectId: pProto1.id,
        componentName: 'ASCS-EE-04 Robotic End-Effector Gripper Mechanism',
        subsystem: 'KINEMATICS',
        designRevision: 'Rev 1.2',
        failureModes: 'Vacuum cold welding risk on titanium pin joints; motor cogging at extreme low temperatures.',
        reviewStage: 'APPROVED_FOR_TESTING',
        reviewerUserId: uAdmin.id,
        verdict: 'APPROVED_FOR_TESTING',
        verdictNotes: 'Approved for ambient cleanroom test rig. Must not be represented as flight qualification.',
        testingParameters: 'Tolerances: ±0.15mm | Actuation cycles: 10,000 | Max gripping torque: 18 Nm',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'rev-02',
        projectId: pMetrology.id,
        componentName: 'Stereo Vision Metrology Optical Bench',
        subsystem: 'VISION_METROLOGY',
        designRevision: 'Rev 0.9',
        failureModes: 'Baseline calibration drift caused by thermal expansion of mounting plate.',
        reviewStage: 'TECHNICAL_REVIEW',
        reviewerUserId: uEngineer.id,
        verdict: 'PENDING',
        verdictNotes: 'In-progress review focusing on Invar-36 low-expansion alloy substitution.',
        testingParameters: 'Target resolution: 50 microns at 1.5m focal distance.',
        createdAt: now,
        updatedAt: now
      }
    ];

    // 8. Seed Documents
    const docs = [
      {
        id: 'doc-01',
        title: 'Vinastra ASCS Prototype-1 System Architecture Specification',
        fileName: 'ASCS_Prototype_1_Architecture_Spec_v1.pdf',
        filePath: 'data/secure_vault/internal/ASCS_Prototype_1_Architecture_Spec_v1.pdf',
        fileSize: 2450000,
        mimeType: 'application/pdf',
        fileCategory: 'ENGINEERING_REPORT',
        uploadedByUserId: uAdmin.id,
        projectId: pProto1.id,
        institutionId: instHq.id,
        accessLevel: 'INTERNAL_CONFIDENTIAL',
        version: 1,
        downloadCount: 4,
        createdAt: now
      },
      {
        id: 'doc-02',
        title: 'Seed Investment Memorandum & DeepTech Economics Brief 2026',
        fileName: 'Vinastra_Seed_Memorandum_2026.pdf',
        filePath: 'data/secure_vault/internal/Vinastra_Seed_Memorandum_2026.pdf',
        fileSize: 1820000,
        mimeType: 'application/pdf',
        fileCategory: 'PRESENTATION',
        uploadedByUserId: uAdmin.id,
        projectId: null,
        institutionId: null,
        accessLevel: 'INVESTOR_SAFE',
        version: 2,
        downloadCount: 12,
        createdAt: now
      },
      {
        id: 'doc-03',
        title: 'Space Factory ASF-01 Master Blueprint & Module Topology',
        fileName: 'ASF_01_Master_Blueprint_Overview.pdf',
        filePath: 'VINASTRA_Space_Factory_Overview.pdf',
        fileSize: 73886,
        mimeType: 'application/pdf',
        fileCategory: 'FACTORY_BLUEPRINT',
        uploadedByUserId: uAdmin.id,
        projectId: pFactory.id,
        institutionId: instHq.id,
        accessLevel: 'INSTITUTIONAL',
        version: 1,
        downloadCount: 8,
        createdAt: now
      }
    ];

    // 9. Seed Announcements
    const announcements = [
      {
        id: 'ann-01',
        title: 'Mission Control Platform Deployment Live',
        content: 'Welcome to VINASTRA Mission Control. All engineering teams, university researchers, and investors can now access unified project telemetry and milestone updates.',
        targetRole: 'ALL',
        priority: 'HIGH',
        publishedByUserId: uAdmin.id,
        createdAt: now
      },
      {
        id: 'ann-02',
        title: 'Prototype-1 Subsystem Metrology Testing Scheduled',
        content: 'Ground test cell sensor calibration runs begin this Friday. Coordinate test data feeds via Project ASCS-P1.',
        targetRole: 'ENGINEER',
        priority: 'MEDIUM',
        publishedByUserId: uEngineer.id,
        createdAt: now
      }
    ];

    // 10. Seed Notifications
    const notifications = [
      {
        id: 'notif-01',
        userId: uStudent.id,
        title: 'New Assignment Dispatched',
        message: 'Prof. Sunita Sharma assigned task: "Dataset Collection: Carbon Composite Micro-Fractures".',
        type: 'TASK_ASSIGNED',
        read: false,
        link: '/mission-control/?tab=tasks',
        createdAt: now
      },
      {
        id: 'notif-02',
        userId: uAdmin.id,
        title: 'Research Submission Submitted for Review',
        message: 'Aarav Patel submitted paper: "Latency-Tolerant Autonomous Sequence Planning".',
        type: 'SUBMISSION_PENDING',
        read: false,
        link: '/mission-control/admin/?tab=research',
        createdAt: now
      }
    ];

    // 11. Seed Audit Logs
    const auditLogs = [
      {
        id: 'aud-01',
        userId: uAdmin.id,
        action: 'SYSTEM_BOOTSTRAP',
        resourceType: 'SYSTEM',
        resourceId: 'vinastra-core',
        ipAddress: '127.0.0.1',
        userAgent: 'Vinastra-System-Init/2026',
        details: 'Initial system seed database provisioned with verified core entities and secure roles.',
        timestamp: now
      }
    ];

    // 12. Seed Space Factory Master Blueprint Subsystems (Phase 8)
    const subsystems = [
      {
        id: 'sub-01',
        code: 'ASF-ROB',
        name: 'Robotic Construction & Assembly Arms',
        subsystem: 'ROBOTIC_CONSTRUCTION',
        description: 'Dual 6-DoF cooperative robotic manipulators with micro-tolerance end-effectors for structural truss positioning and fastener latching.',
        objectives: 'Autonomous alignment, latching, and fastening within ±0.15mm precision under orbital zero-gravity dynamics.',
        technicalRequirements: 'Operating reach: 4.2m | Max payload: 500kg | Power draw: <450W | Joint repeatability: 50 microns',
        interfaces: 'Interfaces with ASF-MET (Stereo Vision) for visual servoing and ASF-MAT (Cargo Rail) for component retrieval.',
        designRevision: 'Rev 1.3',
        status: 'IN_DEVELOPMENT',
        assignedLead: 'Dr. Vikram Sarabhai',
        openIssues: 'End-effector thermal binding at cryogenic shadow transit (-120°C).',
        version: 3,
        updatedAt: now
      },
      {
        id: 'sub-02',
        code: 'ASF-MFG',
        name: 'Advanced Manufacturing & Additive Extrusion',
        subsystem: 'ADVANCED_MANUFACTURING',
        description: 'Vacuum-compatible continuous carbon-fiber reinforced PEEK and titanium powder sintering cell for on-orbit spare fabrication.',
        objectives: 'Eliminate launch-shroud volume constraints by printing large aperture trusses and support booms directly on-orbit.',
        technicalRequirements: 'Extrusion rate: 120 cm³/hr | Deposition tolerance: ±0.1mm | Chamber vacuum: 10⁻⁴ Torr',
        interfaces: 'Connected to ASF-PWR (Power Bus) and ASF-RES (Recycled Feedstock Hopper).',
        designRevision: 'Rev 1.1',
        status: 'IN_DEVELOPMENT',
        assignedLead: 'Prof. Sunita Sharma',
        openIssues: 'Inter-laminar degassing during rapid vacuum heating cycles.',
        version: 2,
        updatedAt: now
      },
      {
        id: 'sub-03',
        code: 'ASF-PWR',
        name: 'Power Generation & Radiative Storage',
        subsystem: 'POWER_SYSTEMS',
        description: 'Multi-junction gallium-arsenide solar concentrator arrays backed by solid-state battery banks and flywheel kinetics.',
        objectives: 'Provide continuous 25 kW peak power through 35-minute orbital eclipse durations.',
        technicalRequirements: 'Total generation: 45 kW BOL | Storage: 30 kWh solid-state | Bus voltage: 120V DC regulated',
        interfaces: 'Powers all factory bays via redundant optical-isolated power bus lines.',
        designRevision: 'Rev 0.8',
        status: 'PROPOSED',
        assignedLead: 'Vinay Jeedi',
        openIssues: 'Radiator surface degradation under continuous atomic oxygen exposure.',
        version: 1,
        updatedAt: now
      },
      {
        id: 'sub-04',
        code: 'ASF-COM',
        name: 'Communications & Laser Telemetry Link',
        subsystem: 'COMMUNICATIONS',
        description: 'High-bandwidth optical laser terminal providing 10 Gbps inter-satellite link to relay constellation and X-band ground backup.',
        objectives: 'Stream real-time stereoscopic point clouds and digital twin synchronization to ground command.',
        technicalRequirements: 'Laser wavelength: 1550nm | Pointing accuracy: 5 micro-radians | Data throughput: 10 Gbps',
        interfaces: 'Feeds ASF-GND (Digital Twin Telemetry) and mission control ground stations.',
        designRevision: 'Rev 1.0',
        status: 'UNDER_REVIEW',
        assignedLead: 'Dr. Vikram Sarabhai',
        openIssues: 'Beam jitter compensation during robotic arm high-torque maneuvers.',
        version: 2,
        updatedAt: now
      },
      {
        id: 'sub-05',
        code: 'ASF-THM',
        name: 'Thermal Control & Cryogenic Radiators',
        subsystem: 'THERMAL_CONTROL',
        description: 'Loop heat pipes (LHPs) with ammonia working fluid, variable emittance electrochromic louvers, and phase-change thermal capacitors.',
        objectives: 'Maintain core manufacturing electronics and sensor benches between +15°C and +25°C across solar transit extremes.',
        technicalRequirements: 'Heat rejection: 18 kW max | Operating range: -150°C to +150°C external',
        interfaces: 'Thermal jackets wrap ASF-MFG extrusion bay and optical benches.',
        designRevision: 'Rev 1.2',
        status: 'IN_DEVELOPMENT',
        assignedLead: 'Dr. Vikram Sarabhai',
        openIssues: 'Condenser freeze-out protection during prolonged deep eclipse orientations.',
        version: 3,
        updatedAt: now
      },
      {
        id: 'sub-06',
        code: 'ASF-RES',
        name: 'Resource Processing & Raw Feedstock Sorting',
        subsystem: 'RESOURCE_PROCESSING',
        description: 'Thermal vacuum distillation of volatile compounds and centrifugal separation of metal-silicate powders from asteroidal and lunar feedstock.',
        objectives: 'Produce pure iron-nickel and silica powders for additive manufacturing sintering chambers.',
        technicalRequirements: 'Batch capacity: 50 kg/day | Extraction yield: >85% | Particle classification: <45 microns',
        interfaces: 'Supplies refined granular material to ASF-MFG additive hoppers.',
        designRevision: 'Rev 0.6',
        status: 'PROPOSED',
        assignedLead: 'Prof. Sunita Sharma',
        openIssues: 'Zero-g powder fluidization and electrostatic clumping.',
        version: 1,
        updatedAt: now
      },
      {
        id: 'sub-07',
        code: 'ASF-MAT',
        name: 'Material Handling & Magnetic Cargo Rails',
        subsystem: 'MATERIAL_HANDLING',
        description: 'Linear induction motor (LIM) internal rail shuttle transporting standardized modular component pallets across assembly bays.',
        objectives: 'Autonomous transfer of feedstock canisters, completed satellite buses, and replacement tools.',
        technicalRequirements: 'Rail length: 18m | Shuttle speed: 0.5 m/s | Positioning repeatability: ±0.5mm',
        interfaces: 'Bridges storage lockers with ASF-ROB construction bay berths.',
        designRevision: 'Rev 0.9',
        status: 'PROPOSED',
        assignedLead: 'Vinay Jeedi',
        openIssues: 'Electromagnetic interference with sensitive magnetometer payloads.',
        version: 1,
        updatedAt: now
      },
      {
        id: 'sub-08',
        code: 'ASF-GND',
        name: 'Ground Supervision & Physics-Based Digital Twin',
        subsystem: 'GROUND_SUPERVISION',
        description: 'High-fidelity edge simulator running alongside orbital telemetry to predict collision risks, joint thermal stress, and verify assembly commands.',
        objectives: 'Latency-tolerant supervisory control verifying commands prior to orbital execution.',
        technicalRequirements: 'Simulation rate: 100 Hz real-time physics | State latency: <2.5 seconds | Anomaly buffer: 5s',
        interfaces: 'Receives live packet stream via ASF-COM and controls ASF-ROB autonomous sequencer.',
        designRevision: 'Rev 2.0',
        status: 'APPROVED_FOR_TESTING',
        assignedLead: 'Vinay Jeedi',
        openIssues: 'Validation against physical Prototype-1 ground demonstrator sensor telemetry.',
        version: 4,
        updatedAt: now
      }
    ];

    // 13. Seed Innovation Proposals (Phase 6)
    const innovations = [
      {
        id: 'inv-01',
        title: 'Modular Docking Node with Integrated Fluid & Optical Data Bus',
        problemStatement: 'Current space docking mechanisms require separate robotic plug-ins for propellant transfer, high-speed data, and high-voltage power.',
        proposedSolution: 'A tri-conical hermaphroditic docking interface that establishes structural lock, 100Gbps optical bus, and cryogenic fluid couplings in a single stroke.',
        technicalApproach: 'Kinematic alignment pins coupled with dry-break zero-spill fluid poppets and non-contact optical collimators.',
        feasibilityAssessment: 'Simulations indicate 98.4% alignment success within ±15mm initial capture envelope.',
        requiredResources: 'Precision 5-axis CNC machining, silicone seals vacuum test chamber, cleanroom test cell.',
        dependencies: 'Requires ASF-ROB end-effector for docking approach guidance.',
        expectedOutcomes: 'Reduces module assembly time from 4 hours to 12 minutes.',
        risksAndLimitations: 'Seal embrittlement after 100+ mating cycles under direct ultraviolet radiation.',
        authorUserId: uStudent.id,
        relatedSubsystem: 'ASF-MAT',
        status: 'APPROVED_FOR_INVESTIGATION',
        reviewerNotes: 'Highly promising concept. Formally approved for ground cell investigation.',
        decisionByUserId: uAdmin.id,
        decisionAt: now,
        version: 1,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'inv-02',
        title: 'Continuous Sintered Titanium Lattice for Deep Space Reflector Trusses',
        problemStatement: 'Large deployable space antennas suffer from mechanical hinge failure and thermal drift during launch deployment.',
        proposedSolution: 'On-orbit selective laser sintering of ultra-lightweight titanium lattice parabolic ribs.',
        technicalApproach: 'Direct metal laser sintering using spherical Ti-6Al-4V powder in low-gravity vacuum.',
        feasibilityAssessment: 'Finite element analysis confirms 4x stiffness-to-weight ratio compared to folded carbon composite boons.',
        requiredResources: 'Laser sintering test head, vacuum chamber, metallurgical scanner.',
        dependencies: 'Requires ASF-MFG and ASF-PWR 15 kW bus.',
        expectedOutcomes: 'Enables 25-meter aperture radio reflectors without launch fairing diameter constraints.',
        risksAndLimitations: 'Residual thermal stress causing micro-warping of the parabolic curvature.',
        authorUserId: uResearcher.id,
        relatedSubsystem: 'ASF-MFG',
        status: 'UNDER_REVIEW',
        reviewerNotes: 'Under technical evaluation for power consumption bounds.',
        decisionByUserId: null,
        decisionAt: null,
        version: 1,
        createdAt: now,
        updatedAt: now
      }
    ];

    this.data = {
      users: [uAdmin, uEngineer, uResearcher, uStudent, uInvestor],
      institutions: [instHq, instIitb, instIsro],
      projects: [pProto1, pMetrology, pFactory],
      projectMembers: members,
      tasks: tasks,
      researchSubmissions: submissions,
      engineeringReviews: reviews,
      documents: docs,
      meetings: [],
      announcements: announcements,
      notifications: notifications,
      auditLogs: auditLogs,
      inquiries: [],
      passwordResets: [],
      blueprintSubsystems: subsystems,
      innovations: innovations
    };

    await this.persist();
  }

  async persist() {
    if (this.isPersisting) {
      this.needsPersist = true;
      return;
    }

    this.isPersisting = true;
    const jsonStr = JSON.stringify(this.data, null, 2);

    try {
      await fs.mkdir(path.dirname(this.dbPath), { recursive: true });
      await fs.writeFile(this.dbPath, jsonStr, 'utf8');
    } catch {
      // If primary path fails (e.g. read-only filesystem on Vercel), fallback to /tmp
      try {
        await fs.mkdir(path.dirname(fallbackDbPath), { recursive: true });
        await fs.writeFile(fallbackDbPath, jsonStr, 'utf8');
        this.dbPath = fallbackDbPath;
      } catch (err2) {
        console.warn('Notice: Disk persistence unavailable in current runtime. In-memory data active.', err2.message);
      }
    } finally {
      this.isPersisting = false;
      if (this.needsPersist) {
        this.needsPersist = false;
        await this.persist();
      }
    }
  }

  // Repository accessors
  collection(name) {
    if (!this.data[name]) this.data[name] = [];
    return {
      find: (predicate = () => true) => this.data[name].filter(predicate),
      findOne: (predicate) => this.data[name].find(predicate) || null,
      findById: (id) => this.data[name].find((item) => item.id === id) || null,
      insert: async (item) => {
        const record = { id: item.id || `rec-${crypto.randomUUID()}`, ...item };
        this.data[name].push(record);
        await this.persist();
        return record;
      },
      updateById: async (id, updates) => {
        const idx = this.data[name].findIndex((item) => item.id === id);
        if (idx === -1) return null;
        this.data[name][idx] = { ...this.data[name][idx], ...updates, updatedAt: new Date().toISOString() };
        await this.persist();
        return this.data[name][idx];
      },
      deleteById: async (id) => {
        const idx = this.data[name].findIndex((item) => item.id === id);
        if (idx === -1) return false;
        this.data[name].splice(idx, 1);
        await this.persist();
        return true;
      },
      count: (predicate = () => true) => this.data[name].filter(predicate).length
    };
  }
}

export const db = new DatabaseEngine();
