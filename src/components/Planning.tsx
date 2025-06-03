'use client';

import { useState } from 'react';
import { CSVLink } from 'react-csv';
import { Gantt, ViewMode } from 'gantt-task-react';
import "gantt-task-react/dist/index.css";
import { 
  Download, 
  Calendar,
  FileText, 
  CheckCircle, 
  AlertCircle,
  Zap,
  BarChart3
} from 'lucide-react';

type PlanningTask = {
  task: string;
  description: string;
  duration: number | null;
  dependsOn: string | null;
  responsibleRole: string | null;
};

type MissingField = {
  task: string;
  field: 'duration' | 'dependsOn' | 'responsibleRole';
  question: string;
};

export default function Planning() {
  const [sectionText, setSectionText] = useState('');

  const [partialWBS, setPartialWBS] = useState<PlanningTask[]>([]);
  const [missingFields, setMissingFields] = useState<MissingField[]>([]);

  const [finalWBS, setFinalWBS] = useState<PlanningTask[] | null>(null);
  const [missingAnswers, setMissingAnswers] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGeneratePlan() {
    setError(null);
    setLoading(true);
    setFinalWBS(null);
    try {
      const resp = await fetch('/api/planning/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionText,
          projectId: 'demo-project',
          createdBy: 'user@example.com',
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setError(data.error || 'Erreur inconnue');
        setPartialWBS([]);
        setPartialWBS([]);
        setMissingFields([]);
      } else {
        setPartialWBS(data.partialWBS);
        setMissingFields(data.missingFields);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur réseau');
      setPartialWBS([]);
      setMissingFields([]);
    } finally {
      setLoading(false);
    }
  }
  function handleMissingAnswerChange(key: string, value: string) {
    setMissingAnswers((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function handleFinalizePlan() {
    const merged: PlanningTask[] = partialWBS.map((t) => ({
      task: t.task,
      description: t.description,
      duration: t.duration,
      dependsOn: t.dependsOn,
      responsibleRole: t.responsibleRole,
    }));

    missingFields.forEach((mf) => {
      const key = `${mf.task}|${mf.field}`; 
      const answer = missingAnswers[key];
      if (!answer) return;

      const idx = merged.findIndex((x) => x.task === mf.task);
      if (idx === -1) return;

      if (mf.field === 'duration') {
        merged[idx].duration = Number(answer);
      } else if (mf.field === 'dependsOn') {
        merged[idx].dependsOn = answer.trim() || null;
      } else if (mf.field === 'responsibleRole') {
        merged[idx].responsibleRole = answer.trim() || null;
      }
    });

    setFinalWBS(merged);
  }

  const ganttTasks = finalWBS ? (() => {
    const currentDate = new Date();
    const taskDateMap = new Map();

    return finalWBS.map((task, index) => {
      let startDate = new Date(currentDate);

      if (task.dependsOn && taskDateMap.has(task.dependsOn)) {
        const dependentEndDate = taskDateMap.get(task.dependsOn);
        startDate = new Date(dependentEndDate);
        startDate.setDate(startDate.getDate() + 1);
      } else if (!task.dependsOn) {
        startDate = new Date(currentDate);
        currentDate.setDate(currentDate.getDate() + (task.duration || 1) + 1);
      }

      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + (task.duration || 1));

      taskDateMap.set(task.task, endDate);

      return {
        start: startDate,
        end: endDate,
        name: task.task,
        id: `task-${index}`,
        progress: 0,
        type: 'task' as const,
        project: task.responsibleRole || 'Général'
      };
    });
  })() : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">

      <div className="relative z-10 p-6 max-w-7xl mx-auto space-y-8">
        {/* En-tête */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Assistant de Planification IA
          </h1>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Transformez vos spécifications projet en structures détaillées de découpage des tâches avec une planification intelligente
          </p>
        </div>

        {/* Section de saisie */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="text-blue-600" size={20} />
            </div>
            <h2 className="text-2xl font-semibold text-slate-800">Spécification du projet</h2>
          </div>
          
          <label htmlFor="sectionText" className="block font-medium mb-3 text-slate-700">
            Collez ou tapez votre section de spécifications :
          </label>
          <textarea
            id="sectionText"
            rows={8}
            className="w-full border border-slate-200 rounded-xl p-4 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 resize-none"
            placeholder="ex. Section 5.2 – Distribution électrique : L’entrepreneur devra installer 3 nouveaux tableaux de disjoncteurs, mettre à niveau le service principal à 400A, et installer de nouvelles gaines tout au long de l’installation..."
            value={sectionText}
            onChange={(e) => setSectionText(e.target.value)}
          />
          
          <button
            onClick={handleGeneratePlan}
            disabled={loading || !sectionText.trim()}
            className={`mt-6 flex items-center gap-2 px-8 py-4 rounded-xl text-white font-medium transition-all duration-300 ${
              loading || !sectionText.trim()
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:scale-105 shadow-lg hover:shadow-xl'
            }`}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 rounded-full animate-spin border-t-white"></div>
                Génération en cours...
              </>
            ) : (
              <>
                <Zap size={20} />
                Générer le plan
              </>
            )}
          </button>
        </div>

        {/* Affichage erreur */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="text-red-500" size={20} />
            <p className="text-red-700">Erreur : {error}</p>
          </div>
        )}

        {/* WBS partiel + champs manquants */}
        {partialWBS.length > 0 && !finalWBS && (
          <div className="space-y-8">
            {/* WBS partiel */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <BarChart3 className="text-amber-600" size={20} />
                </div>
                <h2 className="text-2xl font-semibold text-slate-800">Structure de découpage des tâches partielle</h2>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold text-slate-700">Tâche</th>
                      <th className="px-6 py-4 text-left font-semibold text-slate-700">Description</th>
                      <th className="px-6 py-4 text-center font-semibold text-slate-700">Durée (jours)</th>
                      <th className="px-6 py-4 text-left font-semibold text-slate-700">Dépend de</th>
                      <th className="px-6 py-4 text-left font-semibold text-slate-700">Responsable</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partialWBS.map(({ task, description, duration, dependsOn, responsibleRole }, i) => (
                      <tr key={i} className="border-t border-slate-200">
                        <td className="px-6 py-3 font-medium text-slate-800 max-w-xs truncate">{task}</td>
                        <td className="px-6 py-3 text-slate-600 max-w-xl truncate">{description}</td>
                        <td className="px-6 py-3 text-center text-slate-700">{duration ?? '-'}</td>
                        <td className="px-6 py-3 text-slate-700">{dependsOn || '-'}</td>
                        <td className="px-6 py-3 text-slate-700">{responsibleRole || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Questions sur champs manquants */}
            {missingFields.length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="text-green-600" size={20} />
                  </div>
                  <h2 className="text-2xl font-semibold text-slate-800">Informations manquantes</h2>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleFinalizePlan();
                  }}
                  className="space-y-4"
                >
                  {missingFields.map(({ task, field, question }, i) => {
                    const key = `${task}|${field}`;
                    return (
                      <div key={i} className="flex flex-col">
                        <label htmlFor={key} className="font-medium mb-1 text-slate-700">
                          {question} <span className="font-semibold text-indigo-600">({task})</span>
                        </label>
                        <input
                          type={field === 'duration' ? 'number' : 'text'}
                          id={key}
                          required
                          min={field === 'duration' ? 1 : undefined}
                          className="border border-slate-300 rounded-md p-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                          placeholder={field === 'duration' ? 'Durée en jours' : field === 'dependsOn' ? 'Tâche dépendante' : 'Rôle responsable'}
                          value={missingAnswers[key] || ''}
                          onChange={(e) => handleMissingAnswerChange(key, e.target.value)}
                        />
                      </div>
                    );
                  })}

                  <button
                    type="submit"
                    className="mt-6 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition transform hover:scale-105 shadow-lg"
                  >
                    Finaliser la planification
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Affichage final + Gantt */}
        {finalWBS && (
          <div className="space-y-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="text-purple-600" size={20} />
                </div>
                <h2 className="text-2xl font-semibold text-slate-800">Planification complète</h2>
              </div>

              <Gantt
                tasks={ganttTasks}
                viewMode={ViewMode.Day}
                locale="fr"
                columnWidth={50}
                listCellWidth="300"
              />
            </div>

            <div className="flex justify-end">
              <CSVLink
                data={finalWBS.map(({ task, description, duration, dependsOn, responsibleRole }) => ({
                  Tâche: task,
                  Description: description,
                  Durée: duration,
                  'Dépend de': dependsOn,
                  Responsable: responsibleRole,
                }))}
                filename="planning.csv"
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 shadow-md transition"
              >
                <Download size={20} />
                Exporter au format CSV
              </CSVLink>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
