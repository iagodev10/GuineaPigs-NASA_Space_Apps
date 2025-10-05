// Translation System for FireWatch
const translations = {
  en: {
    app: {
      name: "FireWatch",
    },
    nav: {
      dashboard: "Dashboard",
      team: "Team",
      about: "About",
    },
    hero: {
      title: "Real-Time Global Fire Monitoring",
      subtitle: "NASA FIRMS satellite data for environmental protection and rapid response",
    },
    stats: {
      active: "Active Fires Globally",
      highRisk: "High Risk",
      confidence: "Average Confidence",
      countries: "Countries Affected",
    },
    search: {
      title: "Search by Country or Region",
      placeholder: "Enter country name (e.g., Brazil, United States, Australia...)",
      quick: "Quick search:",
      cityTitle: "Search by City",
      cityPlaceholder: "Enter city name (e.g., São Paulo, New York, Sydney...)",
      highlight: "Highlight city area on map",
      showFires: "Show only fires in city",
    },
    dashboard: {
      active: "Active Fires",
      highRisk: "High Risk",
      temp: "Average Temperature",
      confidence: "Average Confidence",
      loading: "Loading information...",
    },
    map: {
      title: "Interactive Fire Map",
      toggleTheme: "Toggle map theme",
      refresh: "Refresh data",
      location: "My location",
      clear: "Clear highlights",
      legend: "Legend",
      highConf: "High Confidence (>80%)",
      medConf: "Medium Confidence (50-80%)",
      lowConf: "Low Confidence (<50%)",
      cityArea: "City Area",
      yourLocation: "Your Location",
      loading: "Loading data...",
    },
    team: {
      title: "Our Team",
      subtitle: "Meet the experts behind FireWatch",
      member1: {
        name: "Dr. Carlos Silva",
        role: "Project Leader & Data Scientist",
        bio: "PhD in Computer Science with 15 years of experience in geospatial data analysis and environmental monitoring systems.",
      },
      member2: {
        name: "Ana Rodriguez",
        role: "Senior Software Engineer",
        bio: "Full-stack development specialist and real-time systems architecture expert. Responsible for FireWatch infrastructure.",
      },
      member3: {
        name: "Rafael Santos",
        role: "GIS & Cartography Specialist",
        bio: "Master's in Geography focused on geographic information systems. Develops map visualizations and spatial analysis.",
      },
      member4: {
        name: "Dr. Mariana Costa",
        role: "Environmental Scientist",
        bio: "PhD in Environmental Sciences. Fire ecology and environmental impacts specialist. Coordinates scientific data analysis.",
      },
      member5: {
        name: "Lucas Ferreira",
        role: "UI/UX Designer",
        bio: "Designer with 8 years of experience in complex data interfaces. Responsible for user experience and visual design.",
      },
      member6: {
        name: "Juliana Oliveira",
        role: "Data Analyst",
        bio: "Statistical analysis and machine learning specialist. Develops predictive models for early fire detection.",
      },
      cta: {
        title: "Want to join the team?",
        description: "We're always looking for talented individuals passionate about technology and the environment.",
        button: "Get in Touch",
      },
    },
    about: {
      title: "About FireWatch",
      subtitle: "Cutting-edge technology for global environmental protection",
      mission: {
        title: "Our Mission",
        p1: "FireWatch was born from the urgent need to monitor and respond quickly to wildfires devastating our planet. Our mission is to provide accurate, real-time data on fire hotspots worldwide, empowering authorities, researchers, and communities to make informed decisions to protect lives and the environment.",
        p2: "We use state-of-the-art NASA FIRMS (Fire Information for Resource Management System) satellite technology to detect and track active fires globally, offering an accessible and intuitive platform for visualizing and analyzing this critical data.",
      },
      tech: {
        title: "Cutting-Edge Technology",
        p1: "FireWatch integrates multiple satellite data sources, including MODIS and VIIRS, to provide global coverage with updates every 3 hours. Our platform processes millions of data points daily, applying advanced machine learning algorithms to:",
        feat1: "Detect fire hotspots with over 90% accuracy",
        feat2: "Automatically classify risk and confidence levels",
        feat3: "Predict high-risk areas based on historical patterns",
        feat4: "Generate real-time alerts for critical regions",
      },
      impact: {
        title: "Our Impact",
        p1: "Since FireWatch's launch, we're proud to contribute significantly to global environmental protection:",
        stat1: "Countries Monitored",
        stat2: "Active Users",
        stat3: "Alerts Sent",
        stat4: "Monitoring",
        p2: "We work in partnership with government agencies, environmental NGOs, fire brigades, and research institutions in over 50 countries, providing essential data for rapid response and strategic planning.",
      },
      how: {
        title: "How It Works",
        step1: {
          title: "Data Collection",
          desc: "NASA MODIS and VIIRS satellites continuously scan Earth, detecting thermal anomalies indicating active fires.",
        },
        step2: {
          title: "Processing",
          desc: "Our algorithms process raw data, filtering false positives and calculating confidence and risk levels.",
        },
        step3: {
          title: "Visualization",
          desc: "Data is presented in interactive maps and intuitive dashboards, facilitating analysis and decision-making.",
        },
        step4: {
          title: "Alerts",
          desc: "Automatic notifications are sent to authorities and users when high-risk hotspots are detected.",
        },
      },
      partners: {
        title: "Our Partners",
        subtitle: "We work with world-leading organizations in environmental protection",
      },
      cta: {
        title: "Join Our Mission",
        description: "Be part of the global solution for environmental protection. Access our data and tools for free.",
        button: "Access Dashboard",
      },
    },
    footer: {
      description: "Global fire monitoring system using NASA FIRMS satellite data.",
      quickLinks: "Quick Links",
      contact: "Contact",
      copyright: "© 2025 FireWatch. All rights reserved. Data provided by NASA FIRMS.",
    },
  },
  pt: {
    app: {
      name: "FireWatch",
    },
    nav: {
      dashboard: "Dashboard",
      team: "Equipe",
      about: "Sobre",
    },
    hero: {
      title: "Monitoramento Global de Incêndios em Tempo Real",
      subtitle: "Dados de satélite NASA FIRMS para proteção ambiental e resposta rápida",
    },
    stats: {
      active: "Focos Ativos Globalmente",
      highRisk: "Alto Risco",
      confidence: "Confiança Média",
      countries: "Países Afetados",
    },
    search: {
      title: "Pesquisar por País ou Região",
      placeholder: "Digite o nome do país (ex: Brasil, Estados Unidos, Austrália...)",
      quick: "Busca rápida:",
      cityTitle: "Pesquisar por Cidade",
      cityPlaceholder: "Digite o nome da cidade (ex: São Paulo, Nova York, Sydney...)",
      highlight: "Destacar área da cidade no mapa",
      showFires: "Mostrar apenas focos na cidade",
    },
    dashboard: {
      active: "Focos Ativos",
      highRisk: "Alto Risco",
      temp: "Temperatura Média",
      confidence: "Confiança Média",
      loading: "Carregando informações...",
    },
    map: {
      title: "Mapa Interativo de Focos de Incêndio",
      toggleTheme: "Alternar tema do mapa",
      refresh: "Atualizar dados",
      location: "Minha localização",
      clear: "Limpar destaques",
      legend: "Legenda",
      highConf: "Alta Confiança (>80%)",
      medConf: "Média Confiança (50-80%)",
      lowConf: "Baixa Confiança (<50%)",
      cityArea: "Área da Cidade",
      yourLocation: "Sua Localização",
      loading: "Carregando dados...",
    },
    team: {
      title: "Nossa Equipe",
      subtitle: "Conheça os especialistas por trás do FireWatch",
      member1: {
        name: "Dr. Carlos Silva",
        role: "Líder do Projeto & Cientista de Dados",
        bio: "PhD em Ciência da Computação com 15 anos de experiência em análise de dados geoespaciais e sistemas de monitoramento ambiental.",
      },
      member2: {
        name: "Ana Rodrigues",
        role: "Engenheira de Software Sênior",
        bio: "Especialista em desenvolvimento full-stack e arquitetura de sistemas em tempo real. Responsável pela infraestrutura do FireWatch.",
      },
      member3: {
        name: "Rafael Santos",
        role: "Especialista em GIS & Cartografia",
        bio: "Mestre em Geografia com foco em sistemas de informação geográfica. Desenvolve as visualizações de mapas e análises espaciais.",
      },
      member4: {
        name: "Dra. Mariana Costa",
        role: "Cientista Ambiental",
        bio: "PhD em Ciências Ambientais. Especialista em ecologia de fogo e impactos ambientais. Coordena a análise científica dos dados.",
      },
      member5: {
        name: "Lucas Ferreira",
        role: "Designer UI/UX",
        bio: "Designer com 8 anos de experiência em interfaces de dados complexos. Responsável pela experiência do usuário e design visual.",
      },
      member6: {
        name: "Juliana Oliveira",
        role: "Analista de Dados",
        bio: "Especialista em análise estatística e machine learning. Desenvolve modelos preditivos para detecção precoce de incêndios.",
      },
      cta: {
        title: "Quer fazer parte da equipe?",
        description: "Estamos sempre procurando talentos apaixonados por tecnologia e meio ambiente.",
        button: "Entre em Contato",
      },
    },
    about: {
      title: "Sobre o FireWatch",
      subtitle: "Tecnologia de ponta para proteção ambiental global",
      mission: {
        title: "Nossa Missão",
        p1: "O FireWatch nasceu da necessidade urgente de monitorar e responder rapidamente aos incêndios florestais que devastam nosso planeta. Nossa missão é fornecer dados precisos e em tempo real sobre focos de incêndio em todo o mundo, capacitando autoridades, pesquisadores e comunidades a tomar decisões informadas para proteger vidas e o meio ambiente.",
        p2: "Utilizamos tecnologia de satélite de última geração da NASA FIRMS (Fire Information for Resource Management System) para detectar e rastrear incêndios ativos globalmente, oferecendo uma plataforma acessível e intuitiva para visualização e análise desses dados críticos.",
      },
      tech: {
        title: "Tecnologia de Ponta",
        p1: "O FireWatch integra múltiplas fontes de dados de satélite, incluindo MODIS e VIIRS, para fornecer cobertura global com atualizações a cada 3 horas. Nossa plataforma processa milhões de pontos de dados diariamente, aplicando algoritmos avançados de machine learning para:",
        feat1: "Detectar focos de incêndio com precisão superior a 90%",
        feat2: "Classificar níveis de risco e confiança automaticamente",
        feat3: "Prever áreas de alto risco com base em padrões históricos",
        feat4: "Gerar alertas em tempo real para regiões críticas",
      },
      impact: {
        title: "Nosso Impacto",
        p1: "Desde o lançamento do FireWatch, temos orgulho de contribuir significativamente para a proteção ambiental global:",
        stat1: "Países Monitorados",
        stat2: "Usuários Ativos",
        stat3: "Alertas Enviados",
        stat4: "Monitoramento",
        p2: "Trabalhamos em parceria com agências governamentais, ONGs ambientais, brigadas de incêndio e instituições de pesquisa em mais de 50 países, fornecendo dados essenciais para resposta rápida e planejamento estratégico.",
      },
      how: {
        title: "Como Funciona",
        step1: {
          title: "Coleta de Dados",
          desc: "Satélites NASA MODIS e VIIRS escaneiam a Terra continuamente, detectando anomalias térmicas que indicam incêndios ativos.",
        },
        step2: {
          title: "Processamento",
          desc: "Nossos algoritmos processam os dados brutos, filtrando falsos positivos e calculando níveis de confiança e risco.",
        },
        step3: {
          title: "Visualização",
          desc: "Os dados são apresentados em mapas interativos e dashboards intuitivos, facilitando a análise e tomada de decisão.",
        },
        step4: {
          title: "Alertas",
          desc: "Notificações automáticas são enviadas para autoridades e usuários quando focos de alto risco são detectados.",
        },
      },
      partners: {
        title: "Nossos Parceiros",
        subtitle: "Trabalhamos com organizações líderes mundiais em proteção ambiental",
      },
      cta: {
        title: "Junte-se à Nossa Missão",
        description:
          "Seja parte da solução global para proteção ambiental. Acesse nossos dados e ferramentas gratuitamente.",
        button: "Acessar Dashboard",
      },
    },
    footer: {
      description: "Sistema de monitoramento global de incêndios usando dados de satélite NASA FIRMS.",
      quickLinks: "Links Rápidos",
      contact: "Contato",
      copyright: "© 2025 FireWatch. Todos os direitos reservados. Dados fornecidos pela NASA FIRMS.",
    },
  },
  es: {
    app: {
      name: "FireWatch",
    },
    nav: {
      dashboard: "Panel",
      team: "Equipo",
      about: "Acerca de",
    },
    hero: {
      title: "Monitoreo Global de Incendios en Tiempo Real",
      subtitle: "Datos satelitales NASA FIRMS para protección ambiental y respuesta rápida",
    },
    stats: {
      active: "Focos Activos Globalmente",
      highRisk: "Alto Riesgo",
      confidence: "Confianza Promedio",
      countries: "Países Afectados",
    },
    search: {
      title: "Buscar por País o Región",
      placeholder: "Ingrese el nombre del país (ej: Brasil, Estados Unidos, Australia...)",
      quick: "Búsqueda rápida:",
      cityTitle: "Buscar por Ciudad",
      cityPlaceholder: "Ingrese el nombre de la ciudad (ej: São Paulo, Nueva York, Sydney...)",
      highlight: "Resaltar área de la ciudad en el mapa",
      showFires: "Mostrar solo focos en la ciudad",
    },
    dashboard: {
      active: "Focos Activos",
      highRisk: "Alto Riesgo",
      temp: "Temperatura Promedio",
      confidence: "Confianza Promedio",
      loading: "Cargando información...",
    },
    map: {
      title: "Mapa Interactivo de Focos de Incendio",
      toggleTheme: "Cambiar tema del mapa",
      refresh: "Actualizar datos",
      location: "Mi ubicación",
      clear: "Limpiar resaltados",
      legend: "Leyenda",
      highConf: "Alta Confianza (>80%)",
      medConf: "Confianza Media (50-80%)",
      lowConf: "Baja Confianza (<50%)",
      cityArea: "Área de la Ciudad",
      yourLocation: "Su Ubicación",
      loading: "Cargando datos...",
    },
    team: {
      title: "Nuestro Equipo",
      subtitle: "Conozca a los expertos detrás de FireWatch",
      member1: {
        name: "Dr. Carlos Silva",
        role: "Líder del Proyecto y Científico de Datos",
        bio: "PhD en Ciencias de la Computación con 15 años de experiencia en análisis de datos geoespaciales y sistemas de monitoreo ambiental.",
      },
      member2: {
        name: "Ana Rodríguez",
        role: "Ingeniera de Software Senior",
        bio: "Especialista en desarrollo full-stack y arquitectura de sistemas en tiempo real. Responsable de la infraestructura de FireWatch.",
      },
      member3: {
        name: "Rafael Santos",
        role: "Especialista en GIS y Cartografía",
        bio: "Maestría en Geografía enfocada en sistemas de información geográfica. Desarrolla visualizaciones de mapas y análisis espaciales.",
      },
      member4: {
        name: "Dra. Mariana Costa",
        role: "Científica Ambiental",
        bio: "PhD en Ciencias Ambientales. Especialista en ecología del fuego e impactos ambientales. Coordina el análisis científico de datos.",
      },
      member5: {
        name: "Lucas Ferreira",
        role: "Diseñador UI/UX",
        bio: "Diseñador con 8 años de experiencia en interfaces de datos complejos. Responsable de la experiencia del usuario y diseño visual.",
      },
      member6: {
        name: "Juliana Oliveira",
        role: "Analista de Datos",
        bio: "Especialista en análisis estadístico y machine learning. Desarrolla modelos predictivos para detección temprana de incendios.",
      },
      cta: {
        title: "¿Quieres unirte al equipo?",
        description: "Siempre estamos buscando talentos apasionados por la tecnología y el medio ambiente.",
        button: "Contáctanos",
      },
    },
    about: {
      title: "Acerca de FireWatch",
      subtitle: "Tecnología de vanguardia para protección ambiental global",
      mission: {
        title: "Nuestra Misión",
        p1: "FireWatch nació de la necesidad urgente de monitorear y responder rápidamente a los incendios forestales que devastan nuestro planeta. Nuestra misión es proporcionar datos precisos y en tiempo real sobre focos de incendio en todo el mundo, empoderando a autoridades, investigadores y comunidades para tomar decisiones informadas para proteger vidas y el medio ambiente.",
        p2: "Utilizamos tecnología satelital de última generación de NASA FIRMS (Fire Information for Resource Management System) para detectar y rastrear incendios activos globalmente, ofreciendo una plataforma accesible e intuitiva para visualizar y analizar estos datos críticos.",
      },
      tech: {
        title: "Tecnología de Vanguardia",
        p1: "FireWatch integra múltiples fuentes de datos satelitales, incluyendo MODIS y VIIRS, para proporcionar cobertura global con actualizaciones cada 3 horas. Nuestra plataforma procesa millones de puntos de datos diariamente, aplicando algoritmos avanzados de machine learning para:",
        feat1: "Detectar focos de incendio con precisión superior al 90%",
        feat2: "Clasificar automáticamente niveles de riesgo y confianza",
        feat3: "Predecir áreas de alto riesgo basándose en patrones históricos",
        feat4: "Generar alertas en tiempo real para regiones críticas",
      },
      impact: {
        title: "Nuestro Impacto",
        p1: "Desde el lanzamiento de FireWatch, estamos orgullosos de contribuir significativamente a la protección ambiental global:",
        stat1: "Países Monitoreados",
        stat2: "Usuarios Activos",
        stat3: "Alertas Enviadas",
        stat4: "Monitoreo",
        p2: "Trabajamos en asociación con agencias gubernamentales, ONGs ambientales, brigadas de bomberos e instituciones de investigación en más de 50 países, proporcionando datos esenciales para respuesta rápida y planificación estratégica.",
      },
      how: {
        title: "Cómo Funciona",
        step1: {
          title: "Recolección de Datos",
          desc: "Los satélites NASA MODIS y VIIRS escanean continuamente la Tierra, detectando anomalías térmicas que indican incendios activos.",
        },
        step2: {
          title: "Procesamiento",
          desc: "Nuestros algoritmos procesan los datos brutos, filtrando falsos positivos y calculando niveles de confianza y riesgo.",
        },
        step3: {
          title: "Visualización",
          desc: "Los datos se presentan en mapas interactivos y paneles intuitivos, facilitando el análisis y la toma de decisiones.",
        },
        step4: {
          title: "Alertas",
          desc: "Las notificaciones automáticas se envían a autoridades y usuarios cuando se detectan focos de alto riesgo.",
        },
      },
      partners: {
        title: "Nuestros Socios",
        subtitle: "Trabajamos con organizaciones líderes mundiales en protección ambiental",
      },
      cta: {
        title: "Únete a Nuestra Misión",
        description:
          "Sé parte de la solución global para la protección ambiental. Accede a nuestros datos y herramientas de forma gratuita.",
        button: "Acceder al Panel",
      },
    },
    footer: {
      description: "Sistema de monitoreo global de incendios usando datos satelitales NASA FIRMS.",
      quickLinks: "Enlaces Rápidos",
      contact: "Contacto",
      copyright: "© 2025 FireWatch. Todos los derechos reservados. Datos proporcionados por NASA FIRMS.",
    },
  },
}

// Current language state
let currentLanguage = localStorage.getItem("firewatch_language") || "en"

// Initialize translations on page load
function initTranslations() {
  applyTranslations(currentLanguage)
  updateLanguageDisplay(currentLanguage)
}

// Apply translations to the page
function applyTranslations(lang) {
  const elements = document.querySelectorAll("[data-i18n]")

  elements.forEach((element) => {
    const key = element.getAttribute("data-i18n")
    const translation = getNestedTranslation(translations[lang], key)

    if (translation) {
      element.textContent = translation
    }
  })

  // Handle placeholders
  const placeholderElements = document.querySelectorAll("[data-i18n-placeholder]")
  placeholderElements.forEach((element) => {
    const key = element.getAttribute("data-i18n-placeholder")
    const translation = getNestedTranslation(translations[lang], key)

    if (translation) {
      element.placeholder = translation
    }
  })

  // Handle titles
  const titleElements = document.querySelectorAll("[data-i18n-title]")
  titleElements.forEach((element) => {
    const key = element.getAttribute("data-i18n-title")
    const translation = getNestedTranslation(translations[lang], key)

    if (translation) {
      element.title = translation
    }
  })

  // Update HTML lang attribute
  document.documentElement.lang = lang

  // Save to localStorage
  localStorage.setItem("firewatch_language", lang)
  currentLanguage = lang
}

// Get nested translation value
function getNestedTranslation(obj, path) {
  return path.split(".").reduce((current, key) => current?.[key], obj)
}

// Update language display
function updateLanguageDisplay(lang) {
  const langMap = {
    en: "EN",
    pt: "PT",
    es: "ES",
  }

  const currentLangElement = document.getElementById("currentLang")
  if (currentLangElement) {
    currentLangElement.textContent = langMap[lang]
  }
}

// Change language
function changeLanguage(lang) {
  applyTranslations(lang)
  updateLanguageDisplay(lang)

  // Close dropdown
  const dropdown = document.getElementById("languageDropdown")
  if (dropdown) {
    dropdown.classList.remove("active")
  }

  // Close mobile menu
  const mobileMenu = document.getElementById("mobileMenu")
  if (mobileMenu) {
    mobileMenu.classList.remove("active")
  }
}

// Export for use in other scripts
if (typeof window !== "undefined") {
  window.changeLanguage = changeLanguage
  window.initTranslations = initTranslations
  window.currentLanguage = currentLanguage
}
