// lib/astra/planning.ts
import { db } from './client';

export type PlanningTask = {
  task: string;
  description: string;
  duration: number | null;       // can be null in partial WBS
  dependsOn: string | null;
  responsibleRole: string | null;
};

export type MissingField = {
  task: string;       // the task name that is missing info
  field: 'duration' | 'dependsOn' | 'responsibleRole';
  question: string;   // LLM‐generated question for the user
};

export type PlanningDocument = {
  projectId: string;
  sourceSection: string;
  createdAt: string;
  createdBy?: string;
  partialWBS: PlanningTask[];
  missingFields: MissingField[];
  // Optionally, finalWBS?: PlanningTask[]; if you want to store the completed plan later
};

// Change this name if you prefer another collection name
const COLLECTION_NAME = 'planning_tasks';

export function getPlanningCollection() {
  return db.collection<PlanningDocument>(COLLECTION_NAME);
}

export async function ensurePlanningCollection() {
  try {
    await db.createCollection(COLLECTION_NAME);
    console.log('✅ planning_tasks collection is ready');
  } catch (e) {
    if (!(e instanceof Error) || !e.message.includes('already exists')) {
      console.error('Error creating planning_tasks collection:', e);
      throw e;
    }
  }
}
