import { validateTypes } from './watch-types/index.js'
if (process.env.NODE_ENV !== 'production')
	setTimeout(validateTypes, 1500)