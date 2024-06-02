// theme.ts
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  components: {
    MuiSelect: {
      styleOverrides: {
        icon: {
          color: 'white',
        },
        root: {
            backgroundColor: '#273746',
        },
        }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'white',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'white',
            border: 'display',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'white',
          },
        },
      },
    },
  },
});

export default theme;
