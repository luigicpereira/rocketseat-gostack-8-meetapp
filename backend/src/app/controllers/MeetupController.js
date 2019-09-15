import { isBefore, parseISO } from 'date-fns';
import * as Yup from 'yup';

import Meetup from '../models/Meetup';

class MeetupController {
	async index(req, res) {
		const meetups = await Meetup.findAll({ where: { user_id: req.userId } });

		return res.json(meetups);
	}

	async store(req, res) {
		const schema = Yup.object().shape({
			title: Yup.string().required(),
			description: Yup.string().required(),
			location: Yup.string().required(),
			date: Yup.date().required(),
			banner_id: Yup.number().required(),
		});

		if (!(await schema.isValid(req.body))) {
			return res.status(400).json({ error: 'Validation fails' });
		}

		const parsedDate = parseISO(req.body.date);

		if (isBefore(parsedDate, new Date())) {
			return res.status(400).json({ error: 'Past dates are not allowed' });
		}

		req.body.user_id = req.userId;

		const {
			title,
			description,
			location,
			date,
			banner_id,
		} = await Meetup.create(req.body);

		return res.json({ title, description, location, date, banner_id });
	}

	async update(req, res) {
		const schema = Yup.object().shape({
			title: Yup.string().required(),
			description: Yup.string().required(),
			location: Yup.string().required(),
			date: Yup.date().required(),
			banner_id: Yup.number().required(),
		});

		if (!(await schema.isValid(req.body))) {
			return res.status(400).json({ error: 'Validation fails' });
		}

		const meetup = await Meetup.findByPk(req.params.id);

		if (!meetup) {
			return res.status(400).json({ error: "Meetup doesn't exist" });
		}

		if (meetup.user_id !== req.userId) {
			return res
				.status(401)
				.json({ error: 'This meetup is organized by another user' });
		}

		if (meetup.past) {
			return res.status(400).json({ error: 'This meetup already happened' });
		}

		const {
			id,
			title,
			description,
			location,
			date,
			banner_id,
		} = await meetup.update(req.body);

		return res.json({
			id,
			title,
			description,
			location,
			date,
			banner_id,
		});
	}

	async delete(req, res) {
		const meetup = await Meetup.findByPk(req.params.id);

		if (!meetup) {
			return res.status(400).json({ error: "Meetup doesn't exist" });
		}

		if (meetup.user_id !== req.userId) {
			return res
				.status(401)
				.json({ error: 'This meetup is organized by another user' });
		}

		await meetup.destroy();

		return res.json({ id: meetup.id });
	}
}

export default new MeetupController();
