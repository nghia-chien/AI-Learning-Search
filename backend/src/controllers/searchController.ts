import { Request, Response } from 'express';
import { executeSearch } from '../services/searchService';

export const handleSearch = async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Vui lòng nhập từ khóa tìm kiếm (query).' });
    }

    const results = await executeSearch(query);
    return res.json(results);
  } catch (error) {
    console.error('Error handling search:', error);
    return res.status(500).json({ error: 'Lỗi server khi thực hiện tìm kiếm.' });
  }
};
