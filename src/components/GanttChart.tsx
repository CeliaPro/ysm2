'use client';

import { useEffect, useRef } from 'react';
import Gantt from 'frappe-gantt';
import 'frappe-gantt/dist/frappe-gantt.css';

type PlanningTask = {
  task: string;
  description: string;
  duration: number | null;
  dependsOn: string | null;
  responsibleRole: string | null;
};

interface FrappeTask {
  id: string;
  name: string;
  start: string;
  end: string;
  progress: number;
  dependencies?: string;
  custom_class?: string;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export default function GanttChart({
  tasks,
  projectStartDate,
}: {
  tasks: PlanningTask[];
  projectStartDate: Date; // nouvelle prop pour la date de début globale
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Créer un dictionnaire pour stocker la date de fin de chaque tâche calculée
    const taskEndDates: Record<string, Date> = {};

    // Fonction pour calculer récursivement la date de début d'une tâche
    function calculateStartDate(task: PlanningTask): Date {
      if (!task.dependsOn) {
        return projectStartDate;
      }
      // Si la tâche dépend d'une autre, la date de début est le lendemain de la date de fin de la tâche parente
      if (taskEndDates[task.dependsOn]) {
        return addDays(taskEndDates[task.dependsOn], 1);
      } else {
        // Chercher la tâche parente
        const parentTask = tasks.find((t) => t.task === task.dependsOn);
        if (!parentTask) {
          // Pas trouvé, démarrer au début du projet
          return projectStartDate;
        }
        // Calculer la date de début du parent (récursion)
        const parentStart = calculateStartDate(parentTask);
        const dur = parentTask.duration && parentTask.duration > 0 ? parentTask.duration : 1;
        const parentEnd = addDays(parentStart, dur);
        taskEndDates[task.dependsOn] = parentEnd;
        return addDays(parentEnd, 1);
      }
    }

    const frappeTasks: FrappeTask[] = tasks.map((t) => {
      const dur = t.duration && t.duration > 0 ? t.duration : 1;
      const startDate = calculateStartDate(t);
      const endDate = addDays(startDate, dur);

      taskEndDates[t.task] = endDate;

      return {
        id: t.task,
        name: t.task,
        start: formatDate(startDate),
        end: formatDate(endDate),
        progress: 0,
        dependencies: t.dependsOn ? t.dependsOn : undefined,
      };
    });

    new Gantt(containerRef.current, frappeTasks, {
      view_mode: 'Day',
      date_format: 'YYYY-MM-DD',
    });
  }, [tasks, projectStartDate]);

  return (
    <div
      ref={containerRef}
      style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '8px' }}
    />
  );
}
