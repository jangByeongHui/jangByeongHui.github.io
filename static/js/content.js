// DATA ORBIT - real content data module
// Every field here is real biographical data. Do not invent, paraphrase, or add fields.

export const NODE_ORDER = ['about', 'career', 'techStack', 'oss', 'play'];

export const CONTENT = {
  about: {
    id: 'about',
    title: '장병희',
    tagline: '심심함을 프로젝트로 바꾸는 사람, 장병희',
    keywords: [
      'Build Fast',
      'Curious Maker',
      'Playful Thinking',
      '하고 싶은게 생기면 당장 해봐야 직성이 풀려요',
    ],
    hobby: '영화 보기',
    motto: '날 죽이지 못한 고통은 날 강하게 만들 뿐이다',
    location: '인천, Republic of Korea',
    photo: './static/media/profile.jpg',
    photoFallback: './static/media/profile-placeholder.svg',
  },
  career: {
    id: 'career',
    title: 'Data Engineer @ KIA',
    location: '인천, Republic of Korea',
    highlight: 'OpenCV 기반 주차장 관제 및 보행자 측위 시스템 개발',
  },
  techStack: {
    id: 'techStack',
    groups: [
      {
        label: 'Data Engineering',
        items: ['Python', 'Apache Spark', 'Apache Airflow', 'Apache Kafka', 'Hadoop'],
      },
      {
        label: 'Backend & Frontend',
        items: ['Java', 'Spring Boot', 'TypeScript', 'React'],
      },
      {
        label: 'Infra & Monitoring',
        items: ['Grafana', 'Docker'],
      },
    ],
  },
  oss: {
    id: 'oss',
    contributions: [
      {
        repo: 'code-yeongyu/oh-my-openagent',
        pr: '#4176',
        title: 'fix(skill-mcp-manager): trust explicit skill MCP env vars',
        url: 'https://github.com/code-yeongyu/oh-my-openagent/pull/4176',
      },
      {
        repo: 'apache/airflow',
        pr: '#67225',
        title: "Fix DockerOperator on_kill to respect auto_remove='force'",
        url: 'https://github.com/apache/airflow/pull/67225',
      },
      {
        repo: 'danny-avila/LibreChat',
        pr: '#13154',
        title: 'fix: Honor OPENID_REUSE_TOKENS in Admin OAuth Exchange',
        url: 'https://github.com/danny-avila/LibreChat/pull/13154',
      },
    ],
  },
  play: {
    id: 'play',
    totalNodes: 5,
    title: '진행 상황',
    description:
      '지금까지 몇 개의 노드를 탐험했는지 보여주는 진행 카드예요. 다른 노드도 마저 둘러보시면 마지막에 재미있는 게 기다리고 있어요 👀',
    finaleTitle: '🎉 5개 노드 완주!',
    finaleMessage:
      '여기까지 다 눌러보셨다니... 진짜 궁금한 게 많으신 분이거나, 그냥 저처럼 "일단 해보고 보는" 스타일이시겠네요. 실제 이야기는 여기서 이어집니다 👇',
    ctaLabel: 'GitHub에서 만나기',
    ctaUrl: 'https://github.com/jangByeongHui',
  },
};
