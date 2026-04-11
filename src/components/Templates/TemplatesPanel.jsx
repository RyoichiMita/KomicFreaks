import { Layout } from 'lucide-react';
import useEditorStore from '../../stores/editorStore';

const TEMPLATES = [
  {
    id: 'unboxing',
    name: 'Unboxing',
    icon: '📦',
    description: 'Intro → Package → Reveal → Details → Rating → Outro',
    sections: ['Intro', 'Package Reveal', 'Figure Reveal', 'Detail Shots', 'Rating', 'Outro'],
    suggestedScript: "What's up Komic Freaks! Today we're unboxing...",
  },
  {
    id: 'review',
    name: 'Figure Review',
    icon: '⭐',
    description: 'Intro → Overview → Sculpt → Paint → Articulation → Verdict',
    sections: ['Intro', 'Overview', 'Sculpt', 'Paint Quality', 'Articulation', 'Accessories', 'Final Verdict'],
    suggestedScript: "Hey everyone! Today we're reviewing...",
  },
  {
    id: 'news',
    name: 'Figure News',
    icon: '📰',
    description: 'Intro → News 1 → News 2 → News 3 → Outro',
    sections: ['Intro', 'News Item 1', 'News Item 2', 'News Item 3', 'Outro'],
    suggestedScript: "Welcome back to Komic Freaks! Big news today...",
  },
  {
    id: 'posing',
    name: 'Posing Showcase',
    icon: '🎭',
    description: 'Intro → Pose 1 → Pose 2 → Pose 3 → Final Shot',
    sections: ['Intro', 'Pose 1', 'Pose 2', 'Pose 3', 'Dynamic Pose', 'Final Shot'],
    suggestedScript: "Time to pose up! Let's see what this figure can do...",
  },
  {
    id: 'comparison',
    name: 'Comparison',
    icon: '⚔️',
    description: 'Intro → Figure A → Figure B → Side by Side → Winner',
    sections: ['Intro', 'Figure A', 'Figure B', 'Side by Side', 'Final Verdict'],
    suggestedScript: "Battle of the figures! Which one takes the crown?",
  },
  {
    id: 'top5',
    name: 'Top 5 Countdown',
    icon: '🏆',
    description: '#5 → #4 → #3 → #2 → #1 → Honorable Mentions',
    sections: ['Intro', '#5', '#4', '#3', '#2', '#1', 'Honorable Mentions', 'Outro'],
    suggestedScript: "My top 5 figures of the month! Let's count them down...",
  },
];

export default function TemplatesPanel() {
  const { setActiveTemplate, setNarrationScript, addClipToTrack, setActiveTab } = useEditorStore();

  const handleSelectTemplate = (template) => {
    setActiveTemplate(template);
    setNarrationScript(template.suggestedScript);

    // Add placeholder clips for each section
    template.sections.forEach((section, i) => {
      addClipToTrack('video', {
        name: section,
        url: null,
        startTime: 0,
        duration: 8,
        offset: i * 8,
        type: 'video',
      });
    });

    setActiveTab('editor');
  };

  return (
    <div className="ai-panel">
      <div className="ai-card">
        <div className="ai-card-header">
          <div className="ai-card-icon template">
            <Layout size={20} color="white" />
          </div>
          <div>
            <div className="ai-card-title">Video Templates</div>
            <div className="ai-card-description">
              One-click video structures — just add your clips!
            </div>
          </div>
        </div>

        <div className="template-grid">
          {TEMPLATES.map((template) => (
            <div
              key={template.id}
              className="template-card"
              onClick={() => handleSelectTemplate(template)}
            >
              <div className="template-icon">{template.icon}</div>
              <div className="template-info">
                <div className="template-name">{template.name}</div>
                <div className="template-desc">{template.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
