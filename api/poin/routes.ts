import { Router } from 'express';
import {
  addPointWithAggregation,
  updatePointWithAggregation,
  deletePointWithAggregation,
} from './services';
import { verifyIdToken } from '../../src/lib/auth-middleware';

const router = Router();

router.post('/add', verifyIdToken, async (req, res) => {
  try {
    const result = await addPointWithAggregation(req.body);
    res.json(result);
  } catch (error) {
    console.error('Error adding point:', error);
    res.status(500).json({ error: 'Failed to add point' });
  }
});

router.put('/update/:id', verifyIdToken, async (req, res) => {
  try {
    const result = await updatePointWithAggregation(
      req.params.id as string,
      req.body.oldData,
      req.body.newData,
    );
    res.json(result);
  } catch (error) {
    console.error('Error updating point:', error);
    res.status(500).json({ error: 'Failed to update point' });
  }
});

router.delete('/delete/:id', verifyIdToken, async (req, res) => {
  try {
    const result = await deletePointWithAggregation(req.params.id as string, req.body.pointData);
    res.json(result);
  } catch (error) {
    console.error('Error deleting point:', error);
    res.status(500).json({ error: 'Failed to delete point' });
  }
});

export default router;
