import { navigationRef } from '@/brand/navigator/brand.navigate';

type RouteParams = Record<string, unknown> | undefined;

export const navigate = {
  onNavigate(routeName: string, params?: RouteParams) {
    if (!navigationRef.isReady()) {
      return;
    }

    (navigationRef as never as {
      navigate: (name: string, routeParams?: RouteParams) => void;
    }).navigate(routeName, params);
  },
  goBack() {
    if (navigationRef.isReady() && navigationRef.canGoBack()) {
      navigationRef.goBack();
    }
  },
  replace(routeName: string, params?: RouteParams) {
    if (!navigationRef.isReady()) {
      return;
    }

    navigationRef.reset({
      index: 0,
      routes: [{ name: routeName as never, params: params as never }],
    });
  },
};
