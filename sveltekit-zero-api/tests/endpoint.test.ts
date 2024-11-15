import { expect } from '@std/expect'
import { endpoint } from '../src/server/endpoint.ts'
import { BadRequest, KitResponse, OK } from '../src/server/http.ts'
import { FakeKitEvent, type KitEvent, ParseKitEvent } from '../src/server/kitevent.ts'
import { parseJSON } from '../src/server/parse-json.ts'
import z from 'zod'
import { Generic } from '../src/server/generic.ts'

function zod<Body extends z.ZodTypeAny = never, Query extends z.ZodTypeAny = never>({
	body,
	query
}: {
	body?: Body
	query?: Query
}) {
	return async (event: KitEvent<any, any>) => {
		let result = await parseJSON(event)

		if (result instanceof KitResponse) return result

		const bodyResult = body?.safeParse(result.body)
		if (bodyResult !== undefined && !bodyResult.success) {
			return new BadRequest({
				code: 'invalid_body_schema',
				error: 'Invalid body schema',
				details: bodyResult.error
			})
		}

		const queryResult = query?.safeParse(event.query)
		if (queryResult !== undefined && !queryResult.success) {
			return new BadRequest({
				code: 'invalid_query_schema',
				error: 'Invalid query schema',
				details: queryResult.error
			})
		}

		return new ParseKitEvent<z.output<Body>, z.output<Query>>({
			body: bodyResult?.data,
			query: queryResult?.data
		})
	}
}

Deno.test('Generic endpoint', async () => {
	function someEndpoint<Body, Query extends {}>(event: KitEvent<{ body: Body; query: Query }>) {
		return new OK({ body: event.body, query: event.query })
	}

	const POST = endpoint(
		(event) =>
			new Generic(<const Body, const Opts extends { query: {} }>(body: Body, options?: Opts) =>
				Generic.endpoint(someEndpoint<Body, Opts['query']>(event))
			)
	)

	let [r1] = POST(new FakeKitEvent())
		.use({ name: 'bob' }, { query: { test: 123 } })
		.$.OK((r) => r.body)

	await expect(r1).resolves.toEqual({ body: { name: 'bob' }, query: { test: 123 } })
})

Deno.test('Simple endpoint', async () => {
	const GET = endpoint((event) => new OK({ value: '123' }))

	let [r1] = GET(new FakeKitEvent())
		.use()
		.$.OK((r) => r.body)

	await expect(r1).resolves.toEqual({ value: '123' })
})

Deno.test('endpoint ParseKitEvent', async () => {
	const body = z.object({
		name: z.string().optional()
	})

	const POST = endpoint(
		zod({ body }),
		(event) => {
			return { previousFn: event.body }
		},
		(event) => {
			return new OK(event.results.previousFn)
		}
	)

	let ran = 0

	// @ts-expect-error name must be string
	let r1 = POST(new FakeKitEvent()).use({ name: 123 })
		.any(() => ran++)
		.$.BadRequest((r) => {
			throw new Error('Failed validation', { cause: r })
		})
		.success(() => '')

	let [badRequest] = r1

	await expect(badRequest).resolves.rejects.toThrow('Failed validation')

	let r2 = POST(new FakeKitEvent())
		.use({ name: 'John' })
		.any(() => ran++)
		.$.BadRequest((r) => {
			throw new Error('Failed validation', { cause: r })
		})
		.success((r) => r.body)[1]

	let success = await r2
	expect(success).toEqual({ name: 'John' })

	expect(ran).toBe(2)
})