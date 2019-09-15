import { format, parseISO } from 'date-fns';
import pt from 'date-fns/locale/pt';

import Mail from '../../lib/Mail';

class SubscriptionMail {
	get key() {
		return 'SubscriptionMail';
	}

	async handle({ data }) {
		const { subscription } = data;

		await Mail.sendMail({
			to: `${subscription.meetup.organizer.name} <${subscription.meetup.organizer.email}>`,
			subject: 'Nova Inscrição',
			template: 'subscription',
			context: {
				organizer: subscription.meetup.organizer.name,
				title: subscription.meetup.title,
				date: format(
					parseISO(subscription.meetup.date),
					"dd 'de' MMMM', às' H:mm'h'",
					{
						locale: pt,
					}
				),
				name: subscription.user.name,
				email: subscription.user.email,
			},
		});
	}
}

export default new SubscriptionMail();
