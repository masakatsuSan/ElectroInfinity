export const SYLLABUS_DATA = {
  'PC-EE 301': {
    code: 'PC-EE 301',
    title: 'Electric Circuit Theory',
    credits: 4,
    l: 3, t: 1, p: 0,
    objectives: [
      'To understand the basic concepts of circuit elements and circuit laws.',
      'To analyze DC and AC circuits using mesh and nodal analysis.',
      'To understand network theorems and their applications.',
      'To analyze transient responses in electrical circuits.'
    ],
    modules: [
      {
        title: 'Module 1: Introduction to Circuit Analysis',
        topics: ['Continuous & Discrete, Fixed & Time varying, Linear and Nonlinear, Lumped and Distributed, Passive and Active networks.', 'Independent & Dependent sources, Step, Ramp, Impulse, Sinusoidal, Square, Saw tooth signals.']
      },
      {
        title: 'Module 2: Network Theorems',
        topics: ['Node and Mesh Analysis.', 'Superposition, Thevenin\'s, Norton\'s, Maximum power transfer, Reciprocity theorems as applied to AC circuits.']
      },
      {
        title: 'Module 3: Transient Analysis',
        topics: ['Transient response of RL, RC and RLC Circuits using Laplace transform for DC input and A.C. sinusoidal input.']
      }
    ],
    books: [
      'Asfaq Husain, "Networks and Systems", Khanna Publishing House.',
      'William H. Hayt, "Engineering Circuit Analysis", McGraw Hill Education.'
    ]
  },
  'PC-EE 302': {
    code: 'PC-EE 302',
    title: 'Analog Electronics',
    credits: 3,
    l: 3, t: 0, p: 0,
    objectives: [
      'To understand the characteristics of transistors.',
      'To design and analyze various rectifier and amplifier circuits.',
      'To understand the functioning of OP-AMP and design OP-AMP based circuits.'
    ],
    modules: [
      {
        title: 'Module 1: Diode circuits',
        topics: ['P-N junction diode, I-V characteristics of a diode; review of half-wave and full-wave rectifiers, Zener diodes, clamping and clipping circuits.']
      },
      {
        title: 'Module 2: BJT circuits',
        topics: ['Structure and I-V characteristics of a BJT; BJT as a switch. BJT as an amplifier: small-signal model, biasing circuits, common-emitter, common-base and common-collector amplifiers.']
      },
      {
        title: 'Module 3: MOSFET circuits',
        topics: ['MOSFET structure and I-V characteristics. MOSFET as a switch. MOSFET as an amplifier: small-signal model and biasing circuits, common-source, common-gate and common-drain amplifiers.']
      },
      {
        title: 'Module 4: Differential, multi-stage and operational amplifiers',
        topics: ['Differential amplifier; power amplifier; direct coupled multi-stage amplifier; internal structure of an operational amplifier, ideal op-amp, non-idealities in an op-amp.']
      }
    ],
    books: [
      'J. Millman and A. Grabel, "Microelectronics", McGraw Hill Education.',
      'P. Horowitz and W. Hill, "The Art of Electronics", Cambridge University Press.'
    ]
  },
  'PC-EE 303': {
    code: 'PC-EE 303',
    title: 'Electromagnetic Field Theory',
    credits: 3,
    l: 3, t: 0, p: 0,
    objectives: [
      'To understand the basic laws of electromagnetism.',
      'To obtain the electric and magnetic fields for simple configurations under static conditions.',
      'To analyze time varying electric and magnetic fields.',
      'To understand Maxwell\'s equations in different forms and different media.',
      'To understand the propagation of EM waves.'
    ],
    modules: [
      {
        title: 'Module 1: Review of Vector Calculus',
        topics: ['Vector algebra-addition, subtraction, components of vectors, scalar and vector multiplications, triple products, three orthogonal coordinate systems (rectangular, cylindrical and spherical). Vector calculus-differentiation, partial differentiation, integration, vector operator del, gradient, divergence and curl; integral theorems of vectors.']
      },
      {
        title: 'Module 2: Static Electric Field',
        topics: ['Coulomb\'s law, Electric field intensity, Electrical field due to point charges. Line, Surface and Volume charge distributions. Gauss law and its applications. Absolute Electric potential, Potential difference, Calculation of potential differences for different configurations. Electric dipole, Electrostatic Energy and Energy density.']
      },
      {
        title: 'Module 3: Conductors, Dielectrics and Capacitance',
        topics: ['Current and current density, Ohms Law in Point form, Continuity of current, Boundary conditions of perfect dielectric materials. Permittivity of dielectric materials, Capacitance, Capacitance of a two wire line, Poisson\'s equation, Laplace\'s equation.']
      },
      {
        title: 'Module 4: Static Magnetic Fields',
        topics: ['Biot-Savart Law, Ampere Law, Magnetic flux and magnetic flux density, Scalar and Vector Magnetic potentials. Steady magnetic fields produced by current carrying conductors.']
      },
      {
        title: 'Module 5: Magnetic Forces, Materials and Inductance',
        topics: ['Force on a moving charge, Force on a differential current element, Force between differential current elements, Nature of magnetic materials, Magnetization and permeability, Magnetic boundary conditions, Magnetic circuits, inductances and mutual inductances.']
      },
      {
        title: 'Module 6: Time Varying Fields and Maxwell\'s Equations',
        topics: ['Faraday\'s law for Electromagnetic induction, Displacement current, Point form of Maxwell\'s equation, Integral form of Maxwell\'s equations, Motional Electromotive forces.']
      }
    ],
    books: [
      'M. N. O. Sadiku, "Elements of Electromagnetics", Oxford University Publication.',
      'W. H. Hayt and J. A. Buck, "Engineering Electromagnetics", McGraw Hill Education.'
    ]
  },
  'ES-ME 301': {
    code: 'ES-ME 301',
    title: 'Engineering Mechanics',
    credits: 3,
    l: 3, t: 0, p: 0,
    objectives: [
      'To understand basic kinematics concepts and laws of motion.',
      'To learn how to analyze planar rigid body statics.',
      'To understand the concepts of friction, centroid and center of gravity.'
    ],
    modules: [
      {
        title: 'Module 1: Introduction to Engineering Mechanics',
        topics: ['Force Systems Basic concepts, Particle equilibrium in 2-D & 3-D; Rigid Body equilibrium; System of Forces, Coplanar Concurrent Forces, Components in Space – Resultant- Moment of Forces and its Application.']
      },
      {
        title: 'Module 2: Friction',
        topics: ['Types of friction, Limiting friction, Laws of Friction, Static and Dynamic Friction; Motion of Bodies, wedge friction, screw jack & differential screw jack.']
      },
      {
        title: 'Module 3: Basic Structural Analysis',
        topics: ['Equilibrium in three dimensions; Method of Sections; Method of Joints; How to determine if a member is in tension or compression; Simple Trusses; Zero force members.']
      },
      {
        title: 'Module 4: Centroid and Centre of Gravity',
        topics: ['Centroid of simple figures from first principle, centroid of composite sections; Centre of Gravity and its implications.']
      },
      {
        title: 'Module 5: Virtual Work and Energy Method',
        topics: ['Virtual displacements, principle of virtual work for particle and ideal system of rigid bodies, degrees of freedom.']
      }
    ],
    books: [
      'Irving H. Shames, "Engineering Mechanics", Prentice-Hall.',
      'F. P. Beer and J. R. Johnston, "Vector Mechanics for Engineers", Vol I - Statics, Vol II, – Dynamics, McGraw Hill.'
    ]
  },
  'BS-M 301': {
    code: 'BS-M 301',
    title: 'Mathematics-III',
    credits: 3,
    l: 3, t: 0, p: 0,
    objectives: [
      'To familiarize the prospective engineers with techniques in probability and statistics.',
      'To provide an overview of complex variables and their applications.',
      'To learn numerical methods for solving engineering problems.'
    ],
    modules: [
      {
        title: 'Module 1: Probability and Statistics',
        topics: ['Basic Probability: Probability spaces, conditional probability, independence; Discrete random variables, Independent random variables, the multinomial distribution.']
      },
      {
        title: 'Module 2: Continuous Probability Distributions',
        topics: ['Continuous random variables and their properties, distribution functions and densities, normal, exponential and gamma densities. Bivariate distributions and their properties.']
      },
      {
        title: 'Module 3: Applied Statistics',
        topics: ['Curve fitting by the method of least squares- fitting of straight lines, second degree parabolas and more general curves. Correlation and regression - Rank correlation.']
      },
      {
        title: 'Module 4: Complex Variables',
        topics: ['Differentiation, Cauchy-Riemann equations, analytic functions, harmonic functions, finding harmonic conjugate; elementary analytic functions (exponential, trigonometric, logarithm) and their properties.']
      }
    ],
    books: [
      'Erwin Kreyszig, "Advanced Engineering Mathematics", John Wiley & Sons.',
      'P. G. Hoel, S. C. Port and C. J. Stone, "Introduction to Probability Theory", Universal Book Stall.'
    ]
  },
  'BS-EE301': {
    code: 'BS-EE301',
    title: 'Biology for Engineers',
    credits: 3,
    l: 3, t: 0, p: 0,
    objectives: [
      'To understand the biological concepts relevant to engineering.',
      'To appreciate the application of engineering principles to biological systems.'
    ],   
    modules: [
      {
        title: 'Module 1: Introduction',
        topics: ['Purpose: To convey that Biology is as important a scientific discipline as Mathematics, Physics and Chemistry.']
      },
      {
        title: 'Module 2: Classification',
        topics: ['Hierarchy of life forms at phenomenological level. A common thread weaves this hierarchy Classification discussed as based on (a) cellularity- Unicellular or multicellular (b) ultrastructure- prokaryotes or eucaryotes.']
      },
      {
        title: 'Module 3: Genetics',
        topics: ['Mendel\'s laws, Concept of segregation and independent assortment. Concept of allele. Gene mapping, Gene interaction, Epistasis. Meiosis and Mitosis.']
      },
      {
        title: 'Module 4: Biomolecules',
        topics: ['Purpose: To convey that all forms of life have the same building blocks and yet the manifestations are as diverse as one can imagine.']
      }
    ],
    books: [
      'N. A. Campbell, J. B. Reece, L. Urry, M. L. Cain and S. A. Wasserman, "Biology: A global approach", Pearson Education.',
      'Outlines of Biochemistry, Conn, E.E; Stumpf, P.K; Bruening, G; Doi, R.H., John Wiley and Sons.'
    ]
  },
  'MC-EE 301': {
    code: 'MC-EE 301',
    title: 'Indian Constitution',
    credits: 0,
    l: 3, t: 0, p: 0,
    objectives: [
      'To understand the basic features of Indian Constitution.',
      'To know the fundamental rights and duties of citizens.',
      'To understand the structure of the Union and State governments.'
    ],
    modules: [
      {
        title: 'Module 1: Introduction to Constitution',
        topics: ['Meaning of the constitution law and constitutionalism, Historical perspective of the Constitution of India, Salient features and characteristics of the Constitution of India.']
      },
      {
        title: 'Module 2: Fundamental Rights',
        topics: ['Scheme of the fundamental rights, The scheme of the Fundamental Duties and its legal status, The Directive Principles of State Policy – Its importance and implementation.']
      },
      {
        title: 'Module 3: Federal Structure',
        topics: ['Federal structure and distribution of legislative and financial powers between the Union and the States, Parliamentary Form of Government in India – The constitution powers and status of the President of India.']
      }
    ],
    books: [
      'D.D. Basu, "Introduction to the Constitution of India", Lexis Nexis.',
      'P.M. Bakshi, "The Constitution of India", Universal Law Publishing.'
    ]
  },
  'PC-EE 401': {
    code: 'PC-EE 401',
    title: 'Electric Machine-I',
    credits: 3,
    l: 3, t: 0, p: 0,
    objectives: [
      'To understand the concepts of magnetic circuits.',
      'To understand the operation of dc machines.',
      'To analyze the differences in operation of different dc machine configurations.',
      'To analyze single phase and three phase transformers circuits.'
    ],
    modules: [
      {
        title: 'Module 1: Magnetic fields and magnetic circuits',
        topics: ['Review of magnetic circuits - MMF, flux, reluctance, inductance; review of Ampere Law and Biot Savart Law; Visualization of magnetic fields produced by a bar magnet and a current carrying coil.']
      },
      {
        title: 'Module 2: DC machines',
        topics: ['Basic construction of a DC machine, magnetic structure - stator yoke, stator poles, pole-faces or shoes, air gap and armature core. Magnetic circuit of a DC machine. Commutator, armature winding.']
      },
      {
        title: 'Module 3: DC machine - motoring and generation',
        topics: ['Armature reaction, motoring and generation, DC generators - separately excited, shunt and series. DC motors - separately excited, shunt and series. Speed control of dc motors.']
      },
      {
        title: 'Module 4: Transformers',
        topics: ['Principle, construction and operation of single-phase transformers, equivalent circuit, phasor diagram, voltage regulation, losses and efficiency. Auto-transformers. Three-phase transformer connections.']
      }
    ],
    books: [
      'A. E. Fitzgerald and C. Kingsley, "Electric Machinery", New York, McGraw Hill Education.',
      'P. S. Bimbhra, "Electrical Machinery", Khanna Publishers.'
    ]
  },
  'PC-EE 402': {
    code: 'PC-EE 402',
    title: 'Digital Electronics',
    credits: 3,
    l: 3, t: 0, p: 0,
    objectives: [
      'To understand working of logic families and logic gates.',
      'To design and implement Combinational and Sequential logic circuits.',
      'To understand the process of Analog to Digital conversion and Digital to Analog conversion.',
      'To be able to use PLDs to implement the given logical problem.'
    ],
    modules: [
      {
        title: 'Module 1: Fundamentals of Digital Systems and logic families',
        topics: ['Digital signals, digital circuits, AND, OR, NOT, NAND, NOR and Exclusive-OR operations, Boolean algebra, examples of IC gates, number systems-binary, signed binary, octal hexadecimal number.']
      },
      {
        title: 'Module 2: Combinational Digital Circuits',
        topics: ['Standard representation for logic functions, K-map representation, simplification of logic functions using K-map, minimization of logical functions. Multiplexer, De-Multiplexer/Decoders, Adders, Subtractors, BCD arithmetic, carry look ahead adder, serial adder, ALU, elementary ALU design.']
      },
      {
        title: 'Module 3: Sequential circuits and systems',
        topics: ['A 1-bit memory, the circuit properties of Bistable latch, the clocked SR flip flop, J- K-T and D- types flip flops, applications of flipflops, shift registers, applications of shift registers, serial to parallel converter, parallel to serial converter, ring counter.']
      },
      {
        title: 'Module 4: A/D and D/A Converters',
        topics: ['Digital to analog converters: weighted resistor/converter, R-2R Ladder D/A converter. Analog to digital converters: parallel comparator A/D converter, successive approximation A/D converter, counting A/D converter.']
      }
    ],
    books: [
      'R. P. Jain, "Modern Digital Electronics", McGraw Hill Education.',
      'M. M. Mano, "Digital logic and Computer design", Pearson Education India.'
    ]
  },
  'PC-EE 403': {
    code: 'PC-EE 403',
    title: 'Electrical and Electronics Measurement',
    credits: 3,
    l: 3, t: 0, p: 0,
    objectives: [
      'To understand the concepts of measurement and error.',
      'To understand the working of analog and digital instruments.',
      'To measure resistance, inductance and capacitance.',
      'To understand the use of sensors and transducers.'
    ],
    modules: [
      {
        title: 'Module 1: Measurement and Errors',
        topics: ['Concepts of measurement, accuracy, precision, sensitivity, resolution, errors in measurement, statistical analysis of errors.']
      },
      {
        title: 'Module 2: Analog Instruments',
        topics: ['Classification of analog instruments, operating forces, constructional details, PMMC, moving iron, electrodynamometer type instruments, extension of instrument ranges, shunts and multipliers.']
      },
      {
        title: 'Module 3: Measurement of Resistance, Inductance and Capacitance',
        topics: ['Measurement of low, medium and high resistance, AC bridges for measurement of inductance and capacitance, Maxwell\'s bridge, Hay\'s bridge, Schering bridge, Wien bridge.']
      },
      {
        title: 'Module 4: Digital Instruments and Transducers',
        topics: ['Digital voltmeters, digital multimeters, digital frequency meter, digital measurement of time, phase and frequency. Classification of transducers, selection of transducers, resistive, inductive and capacitive transducers, piezoelectric and photoelectric transducers.']
      }
    ],
    books: [
      'A. K. Sawhney, "A Course in Electrical and Electronic Measurements and Instrumentation", Dhanpat Rai & Co.',
      'E. W. Golding and F. C. Widdis, "Electrical Measurements and Measuring Instruments", Reem Publications.'
    ]
  },
  'ES-EE 401': {
    code: 'ES-EE 401',
    title: 'Thermal Power Engineering',
    credits: 3,
    l: 3, t: 0, p: 0,
    objectives: [
      'To understand the basic concepts of thermodynamics and its applications.',
      'To analyze power cycles and understand the working of steam generators.',
      'To understand the basic principles of steam turbines and gas turbines.'
    ],
    modules: [
      {
        title: 'Module 1: Basic Thermodynamics',
        topics: ['System, boundary, surrounding, state, property, process, cycle, thermodynamic equilibrium. First law of thermodynamics, internal energy, enthalpy, steady flow energy equation. Second law of thermodynamics, entropy.']
      },
      {
        title: 'Module 2: Properties of Pure Substances',
        topics: ['Properties of pure substances, p-v, p-T, T-s, h-s diagrams, dryness fraction, steam tables, Mollier chart.']
      },
      {
        title: 'Module 3: Steam Power Cycles',
        topics: ['Carnot cycle, Rankine cycle, reheat cycle, regenerative cycle, binary vapour cycle.']
      },
      {
        title: 'Module 4: Steam Generators and Turbines',
        topics: ['Types of boilers, boiler mountings and accessories, boiler performance. Impulse and reaction turbines, compounding of turbines, velocity diagrams, efficiency.']
      }
    ],
    books: [
      'P. K. Nag, "Engineering Thermodynamics", McGraw Hill Education.',
      'R. K. Rajput, "Thermal Engineering", Laxmi Publications.'
    ]
  },
  'HM-EE401': {
    code: 'HM-EE401',
    title: 'Values and Ethics in Profession',
    credits: 3,
    l: 3, t: 0, p: 0,
    objectives: [
      'To understand the importance of values and ethics in engineering profession.',
      'To understand the ethical theories and their applications.',
      'To develop a sense of responsibility towards society and environment.'
    ],
    modules: [
      {
        title: 'Module 1: Human Values',
        topics: ['Morals, values and ethics. Integrity. Work ethic. Service learning. Civic virtue. Respect for others. Living peacefully. Caring. Sharing. Honesty. Courage. Valuing time. Cooperation. Commitment. Empathy. Self-confidence. Character. Spirituality. Introduction to Yoga and meditation for professional excellence and stress management.']
      },
      {
        title: 'Module 2: Engineering Ethics',
        topics: ['Senses of \'Engineering Ethics\'. Variety of moral issues. Types of inquiry. Moral dilemmas. Moral Autonomy. Kohlberg\'s theory. Gilligan\'s theory. Consensus and Controversy. Models of professional roles. Theories about right action. Self-interest. Customs and Religion. Uses of Ethical Theories.']
      },
      {
        title: 'Module 3: Engineering as Social Experimentation',
        topics: ['Engineering as Experimentation. Engineers as responsible Experimenters. Codes of Ethics. A Balanced Outlook on Law.']
      }
    ],
    books: [
      'R. S. Naagarazan, "Professional Ethics and Human Values", New Age International.',
      'A. Alavudeen, R. Kalil Rahman and M. Jayakumaran, "Professional Ethics and Human Values", Laxmi Publications.'
    ]
  },
  'MC- EE401': {
    code: 'MC- EE401',
    title: 'Environmental Science',
    credits: 0,
    l: 3, t: 0, p: 0,
    objectives: [
      'To understand the basic concepts of environmental science.',
      'To understand the different types of pollution and their control measures.',
      'To develop a sense of responsibility towards the environment.'
    ],
    modules: [
      {
        title: 'Module 1: Introduction to Environmental Science',
        topics: ['Definition, scope and importance. Need for public awareness. Natural Resources: Renewable and non-renewable resources. Role of an individual in conservation of natural resources.']
      },
      {
        title: 'Module 2: Ecosystems',
        topics: ['Concept of an ecosystem. Structure and function of an ecosystem. Producers, consumers and decomposers. Energy flow in the ecosystem. Ecological succession. Food chains, food webs and ecological pyramids.']
      },
      {
        title: 'Module 3: Environmental Pollution',
        topics: ['Definition. Cause, effects and control measures of: Air pollution, Water pollution, Soil pollution, Marine pollution, Noise pollution, Thermal pollution, Nuclear hazards. Solid waste Management: Causes, effects and control measures of urban and industrial wastes. Role of an individual in prevention of pollution.']
      }
    ],
    books: [
      'E. Bharucha, "Textbook of Environmental Studies for Undergraduate Courses", Universities Press.',
      'A. K. De, "Environmental Chemistry", New Age International.'
    ]
  },
  'PC-EE 391': {
  code: 'PC-EE 391',
  title: 'Electric Circuit Theory Laboratory',
  credits: 1,
  l: 0, t: 0, p: 2,
  objectives: [
    'To perform experiments on transient response of electrical circuits.',
    'To analyze two-port networks and filter circuits using hardware and simulation.',
    'To generate and analyze different signals using MATLAB.',
    'To verify network theorems through practical experiments.'
  ],
  modules: [
    {
      title: 'Module 1: Circuit Transient Analysis',
      topics: [
        'Transient response of RL and RC networks using simulation and hardware.',
        'Transient response of series and parallel RLC circuits using simulation and hardware.'
      ]
    },
    {
      title: 'Module 2: Network Analysis',
      topics: [
        'Determination of impedance (Z) and admittance (Y) parameters of two-port networks.',
        'Verification of network theorems using software and hardware.'
      ]
    },
    {
      title: 'Module 3: Filters and MATLAB Applications',
      topics: [
        'Frequency response of LP, HP, BP and BR filters.',
        'Generation of periodic, exponential, sinusoidal, damped sinusoidal, step, impulse and ramp signals using MATLAB.',
        'Determination of Laplace transform and inverse Laplace transform using MATLAB.',
        'Amplitude and phase spectrum analysis of different signals using MATLAB.'
      ]
    }
  ],
  books: [
    'Asfaq Husain, "Networks and Systems", Khanna Publishing House.',
    'William H. Hayt, "Engineering Circuit Analysis", McGraw Hill Education.'
  ]
},
};

export const getCourseDetails = (code) => {
  // Decode URI component to handle spaces in code (e.g. "PC-EE 301")
  const decodedCode = decodeURIComponent(code);
  
  if (!SYLLABUS_DATA[decodedCode]) {
    return {
      code: decodedCode,
      title: 'Course details pending',
      credits: '-',
      l: '-', t: '-', p: '-',
      objectives: ['Detailed syllabus content has not been uploaded yet.'],
      modules: [],
      books: []
    };
  }
  return SYLLABUS_DATA[decodedCode];
};
