import type { KitResponse, StatusCode, Statuses, StatusTextType } from "./server/http.ts"
import type { AwaitAll, IfAny, IsAny, Promisify } from "./utils/types.ts"

/**
IfAny<Results, {}, {
		[K in StatusText]: <A extends [Returned] extends [never] ? void : any>(
			cb: (response: Results extends KitResponse<infer A, K, infer C> ? Results : never) => A
		) => EndpointProxy<Results, [Returned] extends [never] ? never : [...Returned, Promisify<A | undefined>]>
	}> 
 */

type ProxyCallback<
	Results extends KitResponse,
	StatusText extends StatusTextType,
	Returned extends Promisify<any>[] = never
> =
	// Only provide callbacks to the KitResponse's we know are there, otherwise none at all.
	& ('anystring' extends StatusText ? {} : {
		[K in StatusText]: <A extends [Returned] extends [never] ? void : any>(
			cb: (response: Results extends KitResponse<infer A, K, infer C> ? Results : never) => A
		) => EndpointProxy<Results, [Returned] extends [never] ? never : [...Returned, Promisify<A | undefined>]>
	})
	& ([Returned] extends [never] ? {
		$: EndpointProxy<Results, []>
	} : {})

/**
 * An `EndpointResponse` return type, that can be proxy-crawled
 * to do `.OK(...).$.error(...)` etc.
 *
 * This should work the same on frontend and backend.
 */
export type EndpointProxy<Results extends KitResponse, Returned extends Promisify<any>[] = never> = 
	// Promise<KitResponse>     $:  Promise<[...any[]]>
	& Promise<[Returned] extends [never] ? Results : AwaitAll<Returned>>
	// $:  [...Promise<any>[]]
	& ([Returned] extends [never] ? {} : Returned)
	// Callback chain of Response types (.OK, .BadRequest ...)
	& ([Results] extends [KitResponse<infer _, infer StatusText>]
		? ProxyCallback<Results, StatusText extends StatusTextType ? StatusText : never, Returned>
		: {}) 
	// Callback chain of Response statuses (.success, .clientError ...)
	& {
		[K in keyof Statuses]: <A extends [Returned] extends [never] ? void : any>(
			cb: (
				response: Results extends KitResponse<StatusCode[Statuses[K]]> ? Results : never
			) => A
		) => EndpointProxy<Results, [Returned] extends [never] ? never : [...Returned, Promisify<A | undefined>]>
	}