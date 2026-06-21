package com.myspa.flixtor

import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.swmansion.rnscreens.fragment.restoration.RNScreensFragmentFactory
import com.zoontek.rnbootsplash.RNBootSplash
import androidx.core.view.WindowCompat

class MainActivity : ReactActivity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    supportFragmentManager.fragmentFactory = RNScreensFragmentFactory()
    WindowCompat.setDecorFitsSystemWindows(window, false)
    RNBootSplash.init(this, R.style.BootTheme)
    super.onCreate(savedInstanceState)
  }

  override fun getMainComponentName(): String = "Flixtor"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
    DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
