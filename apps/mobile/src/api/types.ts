import type { RouteInput, RouteName, RouteOutput } from '@lokky/shared';

export interface ApiClient {
  request<R extends RouteName>(route: R, input: RouteInput<R>): Promise<RouteOutput<R>>;
}
