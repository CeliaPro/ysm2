import { useEffect, useState } from "react";
import { Gantt, ViewMode, Task as GanttTask } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import { Calendar, Clock, FileSpreadsheet, CalendarPlus } from "lucide-react";
import * as XLSX from 'xlsx';

type PlanningTask = {
  task: string;
  description?: string;
  duration?: number;
  dependsOn?: string;
  responsibleRole?: string;
};

export default function PlanningView() {
  const [tasks, setTasks] = useState<PlanningTask[]>([]);
  const [ganttTasks, setGanttTasks] = useState<GanttTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Fonction d'export vers Google Calendar
  const addToGoogleCalendar = () => {
    if (ganttTasks.length === 0) {
      alert("Aucune tâche à ajouter au calendrier");
      return;
    }

    // Fonction pour encoder les caractères spéciaux pour URL
    const encodeForUrl = (str: string) => encodeURIComponent(str);

    // Fonction pour formater la date pour Google Calendar (YYYYMMDDTHHMMSSZ)
    const formatDateForGoogle = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    // Créer un événement pour chaque tâche
    ganttTasks.forEach((ganttTask, index) => {
      const originalTask = tasks[index];
      
      // Préparer les détails de l'événement
      const title = encodeForUrl(ganttTask.name);
      const startDate = formatDateForGoogle(ganttTask.start);
      const endDate = formatDateForGoogle(ganttTask.end);
      
      // Description détaillée
      let description = `Tâche du projet: ${ganttTask.name}`;
      if (originalTask?.description) {
        description += `\n\nDescription: ${originalTask.description}`;
      }
      if (originalTask?.responsibleRole) {
        description += `\n\nResponsable: ${originalTask.responsibleRole}`;
      }
      if (originalTask?.dependsOn) {
        description += `\n\nDépend de: ${originalTask.dependsOn}`;
      }
      description += `\n\nDurée: ${originalTask?.duration || 1} jour(s)`;
      description += `\n\nGénéré automatiquement depuis la planification de projet`;
      
      const encodedDescription = encodeForUrl(description);
      
      // Construire l'URL Google Calendar
      const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${encodedDescription}&sf=true&output=xml`;
      
      // Ouvrir dans un nouvel onglet
      window.open(googleCalendarUrl, '_blank');
      
      // Petit délai entre chaque ouverture pour éviter le blocage des pop-ups
      if (index < ganttTasks.length - 1) {
        setTimeout(() => {}, 500);
      }
    });
  };
  const exportToExcel = () => {
    // Créer le classeur
    const workbook = XLSX.utils.book_new();
    
    // Préparer les données principales pour le tableau Excel
    const tableData = [
      ["Nom de la Tâche", "Description", "Date de Début", "Date de Fin", "Durée (Jours)", "Dépendances", "Rôle Responsable"],
      ...ganttTasks.map((ganttTask, index) => {
        const originalTask = tasks[index];
        return [
          ganttTask.name || "",
          originalTask?.description || "",
          ganttTask.start.toLocaleDateString('fr-FR'),
          ganttTask.end.toLocaleDateString('fr-FR'),
          originalTask?.duration || 1,
          originalTask?.dependsOn || "",
          originalTask?.responsibleRole || "",
        ];
      })
    ];
    
    // Créer la feuille principale
    const worksheet = XLSX.utils.aoa_to_sheet(tableData);
    
    // Redimensionner automatiquement les colonnes
    const colWidths = [
      { wch: 30 }, // Nom de la Tâche
      { wch: 50 }, // Description
      { wch: 15 }, // Date de Début
      { wch: 15 }, // Date de Fin
      { wch: 15 }, // Durée
      { wch: 25 }, // Dépendances
      { wch: 20 }, // Rôle Responsable
    ];
    worksheet['!cols'] = colWidths;
    
    // Ajouter un résumé de projet dans une zone séparée
    const summaryStartRow = tableData.length + 2;
    const summaryData = [
      ['RÉSUMÉ DU PROJET'],
      ['Nombre Total de Tâches', tasks.length],
      ['Durée Totale (Jours)', tasks.reduce((sum, task) => sum + (task.duration || 0), 0)],
      ['Durée Moyenne (Jours)', Math.round(tasks.reduce((sum, task) => sum + (task.duration || 0), 0) / tasks.length) || 0],
      ['Date de Génération', new Date().toLocaleDateString('fr-FR')],
    ];
    
    // Ajouter le résumé à la feuille
    XLSX.utils.sheet_add_aoa(worksheet, summaryData, { origin: `A${summaryStartRow}` });
    
    // Ajouter la feuille au classeur
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Plan de Projet');
    
    // Créer une feuille de visualisation Gantt simple
    const ganttData = [
      ['Nom de la Tâche', 'Date de Début', 'Date de Fin', 'Durée', 'Chronologie Visuelle'],
      ...ganttTasks.map((ganttTask, index) => {
        const originalTask = tasks[index];
        const startDate = ganttTask.start.toLocaleDateString('fr-FR');
        const endDate = ganttTask.end.toLocaleDateString('fr-FR');
        const duration = originalTask?.duration || 1;
        const timeline = '█'.repeat(Math.min(duration, 20)); // Barre visuelle
        
        return [
          ganttTask.name,
          startDate,
          endDate,
          duration,
          timeline
        ];
      })
    ];
    
    const ganttSheet = XLSX.utils.aoa_to_sheet(ganttData);
    ganttSheet['!cols'] = [
      { wch: 30 },
      { wch: 15 },
      { wch: 15 },
      { wch: 10 },
      { wch: 25 }
    ];
    
    XLSX.utils.book_append_sheet(workbook, ganttSheet, 'Vue Gantt');
    
    // Exporter le fichier
    const today = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `projet-gantt-${today}.xlsx`);
  };

  // Sauvegarde CSV simple
  // const csvData = [
  //   ["Nom de la Tâche", "Description", "Date de Début", "Date de Fin", "Durée (Jours)", "Dépendances", "Rôle Responsable"],
  //   ...ganttTasks.map((ganttTask, index) => {
  //     const originalTask = tasks[index];
  //     return [
  //       ganttTask.name || "",
  //       originalTask?.description || "",
  //       ganttTask.start.toLocaleDateString('fr-FR') || "",
  //       ganttTask.end.toLocaleDateString('fr-FR') || "",
  //       (originalTask?.duration || 1).toString(),
  //       originalTask?.dependsOn || "",
  //       originalTask?.responsibleRole || "",
  //     ];
  //   })
  // ];

  // Récupérer les données de planification
  useEffect(() => {
    fetch("/api/planning/latest")
      .then((res) => res.json())
      .then((data) => {
        setTasks(data.tasks || []);
        setLoading(false);
      });
  }, []);

  // Convertir les tâches de planification en tâches Gantt
  useEffect(() => {
    if (!tasks.length) return;
    const nameToIndex = Object.fromEntries(tasks.map((t, i) => [t.task, i]));
    const gantt: GanttTask[] = [];
    const ends: Date[] = [];
    tasks.forEach((task, i) => {
      let start = new Date();
      if (task.dependsOn && nameToIndex[task.dependsOn] !== undefined) {
        const depIdx = nameToIndex[task.dependsOn];
        start = new Date(ends[depIdx] || new Date());
      } else if (ends[i - 1]) {
        start = new Date(ends[i - 1]);
      }
      const end = new Date(start);
      end.setDate(start.getDate() + (task.duration || 1));
      ends[i] = new Date(end);

      gantt.push({
        start,
        end,
        name: task.task,
        id: `task-${i}`,
        type: "task",
        progress: 100,
        dependencies: task.dependsOn
          ? [`task-${nameToIndex[task.dependsOn]}`]
          : [],
        styles: {
          progressColor: "#10b981",
          progressSelectedColor: "#059669",
          backgroundColor: "#6366f1",
          backgroundSelectedColor: "#4f46e5",
        },
      });
    });
    setGanttTasks(gantt);
  }, [tasks]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600"></div>
          </div>
          <p className="text-slate-600 font-medium">Chargement de votre chronologie...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      {/* === CORRECTION AGRESSIVE DU TEXTE GANTT === */}
      <style>
        {`
        /* Forcer tout le texte SVG à être sombre et visible - approche la plus agressive */
        .gantt-container svg text,
        .gantt-container svg > g text,
        .gantt-container svg > g > g text,
        .gantt-container svg > g > g > g text {
          fill: #000000 !important;
          font-weight: 700 !important;
          font-size: 14px !important;
          stroke: none !important;
        }
        
        /* Cibler spécifiquement la liste des tâches */
        .gantt-container .task-list-table text,
        .gantt-container .task-list-cell text,
        .gantt-container .task-list-header text {
          fill: #000000 !important;
          font-weight: 700 !important;
          font-size: 14px !important;
        }
        
        /* Cibler les en-têtes calendrier/dates */
        .gantt-container .calendar-header text,
        .gantt-container .calendar-top text,
        .gantt-container .calendar-bottom text {
          fill: #000000 !important;
          font-weight: 700 !important;
          font-size: 13px !important;
        }
        
        /* Barres de tâches - garder le texte blanc sur fond coloré */
        .gantt-container .bar text,
        .gantt-container .bar-label {
          fill: #ffffff !important;
          font-weight: 800 !important;
          font-size: 12px !important;
          text-shadow: 1px 1px 1px rgba(0,0,0,0.5) !important;
        }
        
        /* Remplacer tout texte blanc */
        .gantt-container text[fill="white"],
        .gantt-container text[fill="#ffffff"],
        .gantt-container text[fill="#fff"] {
          fill: #000000 !important;
        }
        
        /* Corrections d'arrière-plan */
        .gantt-container .task-list-table {
          background:rgb(255, 255, 255) !important;
        }
        
        .gantt-container .task-list-row {
          fill: #f8fafc !important;
        }
        
        .gantt-container .task-list-row:nth-child(even) {
          fill: #f1f5f9 !important;
        }
        
        .gantt-container .grid-header {
          fill: #e2e8f0 !important;
        }
        
        /* Style des barres de tâches */
        .gantt-container .bar {
          fill: #6366f1 !important;
          stroke: #4f46e5 !important;
          stroke-width: 1px !important;
        }
        
        .gantt-container .bar-progress {
          fill: #10b981 !important;
          stroke: #059669 !important;
        }
        
        /* Améliorations de la grille */
        .gantt-container .grid-row-line {
          stroke: #e2e8f0 !important;
        }
        
        .gantt-container .grid-tick-line {
          stroke: #cbd5e1 !important;
        }
        
        .gantt-container .today-line {
          stroke: #ef4444 !important;
          stroke-width: 2px !important;
        }
        
        /* Forcer l'arrière-plan du conteneur */
        .gantt-container {
          background: #ffffff !important;
        }
      `}
      </style>
      <div className="relative max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                Planification de Projet
              </h1>
              <p className="text-slate-600">Gérez votre chronologie et vos tâches de projet</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={addToGoogleCalendar}
                className="group flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white shadow-lg rounded-xl border border-blue-500 hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                <CalendarPlus size={18} className="group-hover:text-blue-100 transition-colors" />
                <span className="font-medium">Google</span>
              </button>
              <button
                onClick={exportToExcel}
                className="group flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white shadow-lg rounded-xl border border-green-500 hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                <FileSpreadsheet size={18} className="group-hover:text-green-100 transition-colors" />
                <span className="font-medium">Excel</span>
              </button>
            </div>
          </div>
          {/* Statistiques rapides */}
          {tasks.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{tasks.length}</p>
                    <p className="text-slate-600 text-sm">Tâches Totales</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Clock className="text-indigo-600" size={20} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">
                      {tasks.reduce((sum, task) => sum + (task.duration || 0), 0)}
                    </p>
                    <p className="text-slate-600 text-sm">Jours Totaux</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <div className="w-5 h-5 bg-green-600 rounded-full"></div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">
                      {Math.round(tasks.reduce((sum, task) => sum + (task.duration || 0), 0) / tasks.length) || 0}
                    </p>
                    <p className="text-slate-600 text-sm">Durée Moyenne</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Vue Chronologique */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
            <h2 className="text-xl font-semibold text-slate-800">Vue Chronologique</h2>
          </div>
          <div
            className="rounded-xl border border-slate-200 shadow-inner overflow-x-auto"
            style={{
              background: "#f8fafc",
              minHeight: 360,
              padding: 8,
              margin: "0 auto",
              maxWidth: "100vw",
              color: "rgb(126, 128, 133)",
            }}
          >
            <div style={{
              minWidth: 1100,
              height: 340,
            }}>
              {ganttTasks.length > 0 ? (
                <Gantt
                  tasks={ganttTasks}
                  viewMode={ViewMode.Day}
                  locale="fr-FR"
                  columnWidth={90}
                  listCellWidth={"180px"}
                />
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="text-slate-400" size={24} />
                  </div>
                  <p className="text-slate-500 text-lg">Aucune tâche disponible</p>
                  <p className="text-slate-400">Les tâches apparaîtront ici une fois chargées</p>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Détails des Tâches */}
        {tasks.length > 0 && (
          <div className="mt-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
              <h3 className="text-xl font-semibold text-slate-800">Détails des Tâches</h3>
            </div>
            <div className="grid gap-3">
              {tasks.map((task, index) => (
                <div
                  key={index}
                  className="group p-4 bg-gradient-to-r from-white to-slate-50 rounded-xl border border-slate-200 hover:shadow-md hover:scale-[1.01] transition-all duration-300"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                        {task.task}
                      </h4>
                      <p className="text-slate-600 text-sm mt-1">{task.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        {task.responsibleRole && (
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                            {task.responsibleRole}
                          </span>
                        )}
                        {task.dependsOn && (
                          <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                            Dépend de : {task.dependsOn}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-medium">
                        <Clock size={12} />
                        {task.duration} jours
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}