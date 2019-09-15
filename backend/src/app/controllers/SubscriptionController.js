import { isBefore } from 'date-fns';
import { Op } from 'sequelize';

import Meetup from '../models/Meetup';
import User from '../models/User';
import Subscription from '../models/Subscription';

import Queue from '../../lib/Queue';

import SubscriptionMail from '../jobs/SubscriptionMail';

class SubscriptionController {
	async index(req, res) {
		const subscriptions = await Subscription.findAll({
			attributes: [],
			include: [
				{
					model: Meetup,
					as: 'meetup',
					attributes: ['title', 'description', 'location', 'date'],
					where: {
						date: {
							[Op.gte]: new Date(),
						},
					},
				},
			],
			where: {
				user_id: req.userId,
			},
			order: [
				[
					{
						model: Meetup,
						as: 'meetup',
					},
					'date',
				],
			],
		});

		return res.json(subscriptions);
	}

	async store(req, res) {
		const meetup = await Meetup.findOne({ where: { id: req.body.meetup_id } });

		/**
		 * Check if meetup with this id exists
		 */
		if (!meetup) {
			return res.status(400).json({ error: "Meetup doesn't exist" });
		}

		/**
		 * Check if user trying to subscribe is the meetup organizer
		 */
		if (meetup.user_id === req.userId) {
			return res
				.status(401)
				.json({ error: "You can't subscribe to a meetup you are organizing" });
		}

		/**
		 * Check if meetup already happened
		 */
		if (isBefore(meetup.date, new Date())) {
			return res.status(400).json({ error: 'This meetup already happened' });
		}

		/**
		 * Check if user already subscribed to this meetup
		 */
		const checkSubscription = await Subscription.findOne({
			where: {
				meetup_id: req.body.meetup_id,
				user_id: req.userId,
			},
		});

		if (checkSubscription) {
			return res
				.status(400)
				.json({ error: 'You already subscribed to this meetup' });
		}

		/**
		 * Check if user is already subscribed to a meetup happening at the same time
		 */
		const checkTime = await Subscription.findOne({
			include: [
				{
					model: Meetup,
					as: 'meetup',
					where: {
						date: meetup.date,
					},
				},
			],
		});

		if (checkTime) {
			return res.status(400).json({
				error: 'You are already subscribed to a meetup at this date and time',
			});
		}

		req.body.user_id = req.userId;

		const { id } = await Subscription.create(req.body);

		const subscription = await Subscription.findByPk(id, {
			include: [
				{
					model: Meetup,
					as: 'meetup',
					attributes: ['title', 'date'],
					include: [
						{
							model: User,
							as: 'organizer',
							attributes: ['name', 'email'],
						},
					],
				},
				{
					model: User,
					as: 'user',
					attributes: ['name', 'email'],
				},
			],
		});

		await Queue.add(SubscriptionMail.key, {
			subscription,
		});

		return res.json({
			id: subscription.id,
			meetup_id: req.body.meetup_id,
			user_id: req.userId,
		});
	}
}

export default new SubscriptionController();
