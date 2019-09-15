import { startOfDay, endOfDay, parseISO } from 'date-fns';
import { Op } from 'sequelize';

import Meetup from '../models/Meetup';
import User from '../models/User';

class ScheduleController {
	async index(req, res) {
		const parsedDate = parseISO(req.query.date);

		if (!parsedDate) {
			return res.status(400).json({ error: 'Invalid date' });
		}

		const page = req.query.page || 1;

		const schedule = await Meetup.findAll({
			where: {
				date: {
					[Op.between]: [startOfDay(parsedDate), endOfDay(parsedDate)],
				},
			},
			order: ['date'],
			attributes: ['title', 'description', 'location', 'date'],
			limit: 10,
			offset: (page - 1) * 10,
			include: [
				{
					model: User,
					as: 'organizer',
					attributes: ['name', 'email'],
				},
			],
		});

		return res.json(schedule);
	}
}

export default new ScheduleController();
