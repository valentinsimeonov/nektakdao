// store/ThemeSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
export type ThemeName = 'light'|'dark'|'blue'|'rose';

const saved = (typeof window !== 'undefined')
  ? (localStorage.getItem('theme') as ThemeName)
  : null

const slice = createSlice({
  name: 'theme',

  initialState: saved ?? 'dark',

  reducers: {

    setTheme(_, action: PayloadAction<ThemeName>) {
      const theme = action.payload
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', theme)
      }
      return theme
    }
  }
})

export const { setTheme } = slice.actions
export default slice.reducer
