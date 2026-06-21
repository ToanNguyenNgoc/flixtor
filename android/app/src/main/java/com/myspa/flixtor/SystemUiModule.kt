package com.myspa.flixtor

import android.os.Build
import android.graphics.Rect
import android.view.View
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.core.view.ViewCompat
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class SystemUiModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "SystemUiModule"

  @ReactMethod
  fun enterImmersive() {
    val activity = reactApplicationContext.currentActivity ?: return
    activity.runOnUiThread {
      val window = activity.window
      val decorView = window.decorView

      WindowCompat.setDecorFitsSystemWindows(window, false)

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        val controller = WindowCompat.getInsetsController(window, decorView) ?: return@runOnUiThread
        controller.systemBarsBehavior =
          WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        controller.hide(WindowInsetsCompat.Type.systemBars())
      } else {
        @Suppress("DEPRECATION")
        decorView.systemUiVisibility = (
          View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            or View.SYSTEM_UI_FLAG_FULLSCREEN
            or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
          )
      }
    }
  }

  @ReactMethod
  fun exitImmersive() {
    val activity = reactApplicationContext.currentActivity ?: return
    activity.runOnUiThread {
      val window = activity.window
      val decorView = window.decorView
      ViewCompat.setSystemGestureExclusionRects(decorView, emptyList())

      WindowCompat.setDecorFitsSystemWindows(window, false)

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        val controller = WindowCompat.getInsetsController(window, decorView) ?: return@runOnUiThread
        controller.show(WindowInsetsCompat.Type.systemBars())
      } else {
        @Suppress("DEPRECATION")
        decorView.systemUiVisibility = View.SYSTEM_UI_FLAG_LAYOUT_STABLE
      }
    }
  }

  @ReactMethod
  fun setGestureExclusionRect(xDp: Double, yDp: Double, widthDp: Double, heightDp: Double) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
      return
    }

    val activity = reactApplicationContext.currentActivity ?: return
    activity.runOnUiThread {
      val decorView = activity.window.decorView
      val density = reactApplicationContext.resources.displayMetrics.density
      val rect = Rect(
        (xDp * density).toInt(),
        (yDp * density).toInt(),
        ((xDp + widthDp) * density).toInt(),
        ((yDp + heightDp) * density).toInt(),
      )

      ViewCompat.setSystemGestureExclusionRects(decorView, listOf(rect))
    }
  }

  @ReactMethod
  fun clearGestureExclusionRects() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
      return
    }

    val activity = reactApplicationContext.currentActivity ?: return
    activity.runOnUiThread {
      ViewCompat.setSystemGestureExclusionRects(activity.window.decorView, emptyList())
    }
  }
}
