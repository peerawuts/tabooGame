import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';

function Copyright() {
  return (
    <Typography variant="h5" color="text.secondary" align="center">
      <div>
      {'Copyright © '}
      <Link color="inherit" href="mailto:acquaintedland@gmail.com">
        Acquainted Land
      </Link>{' '}
      {new Date().getFullYear()}
      </div>
      <div>
      {'Feedback to email '}
      <Link color="inherit" href="mailto:acquaintedland@gmail.com">
        aquaintedland@gmail.com
      </Link>
      </div>
    </Typography>
  );
}

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        py: 1,
        px: 2,
        pd: 3,
        width: '100%',
        position: 'absolute',
        left: 0,
        align: 'bottom',
        backgroundColor: (theme) =>
          theme.palette.mode === 'light'
            ? theme.palette.grey[200]
            : theme.palette.grey[800],
      }}
    >
      <Container >
        <Copyright />
      </Container>
    </Box>
  );
}