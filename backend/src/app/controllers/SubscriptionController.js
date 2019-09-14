import { isBefore } from 'date-fns';

import Meetup from '../models/Meetup';
import Subscription from '../models/Subscription';

class SubscriptionController {
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

		return res.json({
			id,
			meetup_id: req.body.meetup_id,
			user_id: req.userId,
		});
	}
}

export default new SubscriptionController();
