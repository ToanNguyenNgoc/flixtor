import {
  DrawerActions,
  StackActions,
  createNavigationContainerRef,
} from '@react-navigation/native';
import { BrandStackParamList } from '../BrandNavigator';
export const navigationRef = createNavigationContainerRef<any>();

export const BrandNavigate = {
  onNavigate: <T extends keyof BrandStackParamList>(
    name: T,
    params?: BrandStackParamList[T] | undefined,
  ) => {
    if (navigationRef.isReady()) {
      // @ts-ignore
      navigationRef.navigate(name, params);
    }
  },
  goBack: () => {
    if (navigationRef.isReady() && navigationRef.canGoBack()) {
      navigationRef.goBack();
    }
  },
  replace: <T extends keyof BrandStackParamList>(
    name: T,
    params?: BrandStackParamList[T] | undefined,
  ) => {
    if (navigationRef.isReady()) {
      navigationRef.dispatch(StackActions.replace(name, params));
    }
  },
  openDrawer: () => {
    if (navigationRef.isReady()) {
      navigationRef.dispatch(DrawerActions.openDrawer());
    }
  },
  closeDrawer: () => {
    if (navigationRef.isReady()) {
      navigationRef.dispatch(DrawerActions.closeDrawer());
    }
  },
  toggleDrawer: () => {
    if (navigationRef.isReady()) {
      navigationRef.dispatch(DrawerActions.toggleDrawer());
    }
  },
  onBackHome: () => {
    if (navigationRef) {
      navigationRef.reset({
        index: 0,
        routes: [{name: 'BrandBottomNavigator'}],
      });
    }
  },
};
