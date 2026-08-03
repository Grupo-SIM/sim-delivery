package com.jbmidia.zero_grau.statusbarstyle

import android.app.Activity
import androidx.core.view.WindowInsetsControllerCompat
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.Plugin

@InvokeArg
class SetAppearanceArgs {
  var light: Boolean = true
}

@TauriPlugin
class StatusbarStylePlugin(private val activity: Activity) : Plugin(activity) {
  @Command
  fun setAppearance(invoke: Invoke) {
    val args = invoke.parseArgs(SetAppearanceArgs::class.java)
    activity.runOnUiThread {
      val window = activity.window
      WindowInsetsControllerCompat(window, window.decorView).isAppearanceLightStatusBars = args.light
    }
    invoke.resolve()
  }
}
