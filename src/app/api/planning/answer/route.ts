// app/api/planning/answer/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  getPlanningCollection,
  PlanningTask,
  MissingField,
} from '@/lib/astra/planning';
import { addMessageToConversation } from '@/lib/actions/conversations/conversation';
import { withAuthentication } from '@/app/utils/auth.utils';

type Answer = {
  task: string;
  field: 'duration' | 'dependsOn' | 'responsibleRole';
  value: string | number;
};

export const POST = withAuthentication(async (req: NextRequest, user) => {
  try {
    const { planningId, answers } = await req.json();

    if (!planningId || typeof planningId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Identifiant de planning requis.' },
        { status: 400 }
      );
    }

    if (!Array.isArray(answers)) {
      return NextResponse.json(
        { success: false, error: 'answers doit être un tableau.' },
        { status: 400 }
      );
    }

    const collection = getPlanningCollection();
    const doc = await collection.findOne({ documentId: planningId });

    if (!doc) {
      return NextResponse.json(
        { success: false, error: 'Document de planning non trouvé.' },
        { status: 404 }
      );
    }

    const { partialWBS } = doc;
    let { missingFields } = doc;

    // Appliquer chaque réponse utilisateur
    for (const answer of answers as Answer[]) {
      const { task, field, value } = answer;
      const taskToUpdate = partialWBS.find((t: PlanningTask) => t.task === task);
      if (!taskToUpdate) continue;

      if (field === 'duration') {
        taskToUpdate.duration = typeof value === 'number' ? value : parseInt(value as string, 10);
      } else if (field === 'dependsOn' || field === 'responsibleRole') {
        taskToUpdate[field] = typeof value === 'string' ? value : String(value);
      }

      // Supprimer la question de missingFields
      missingFields = missingFields.filter(
        (f: MissingField) => !(f.task === task && f.field === field)
      );
    }

    // Mettre à jour le document dans Astra
    await collection.updateOne(
      { documentId: planningId },
      {
        $set: {
          partialWBS,
          missingFields,
          pendingQuestions: missingFields.map(({ task, field }) => ({ task, field })),
        },
      }
    );

    // Si tout est complété, notifier dans la conversation
    if (missingFields.length === 0) {
      await addMessageToConversation({
        conversationId: doc.projectId,
        userId: doc.createdBy,
        content: `✅ Tous les champs manquants ont été renseignés. Le planning est maintenant complet !`,
        role: 'ASSISTANT',
        metadata: {
          planningId,
          mode: 'planning',
          timestamp: Date.now(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      planningId,
      updated: true,
      remainingMissing: missingFields.length,
      partialWBS,
      missingFields,
    });

  } catch (error: any) {
    console.error('Erreur dans /api/planning/answer:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}, 'EMPLOYEE'); // Adjust role if you want finer-grained access
