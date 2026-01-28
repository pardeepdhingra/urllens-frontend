'use client';

// ============================================================================
// URL Lens - About Pardeep Dhingra
// Developer profile page with animations
// ============================================================================

import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Chip,
  IconButton,
  Button,
  Avatar,
  Tooltip,
  Fade,
  Grow,
  Slide,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  LinkedIn,
  Article,
  Email,
  Code,
  Cloud,
  Storage,
  Speed,
  Groups,
  EmojiEvents,
  School,
  Rocket,
  CheckCircle,
  ArrowForward,
} from '@mui/icons-material';
import { Header } from '@/components';
import Link from 'next/link';

// Skill categories with icons and items
const skillCategories = [
  {
    title: 'Backend Development',
    icon: Code,
    color: '#2563eb',
    skills: ['Node.js', 'Ruby on Rails', 'TypeScript', 'REST APIs', 'GraphQL'],
  },
  {
    title: 'Frontend Development',
    icon: Speed,
    color: '#7c3aed',
    skills: ['React.js', 'Next.js', 'TypeScript', 'HTML5', 'CSS3', 'Tailwind'],
  },
  {
    title: 'Cloud & DevOps',
    icon: Cloud,
    color: '#059669',
    skills: ['AWS', 'Google Cloud', 'Lambda', 'S3', 'CloudFront', 'GitLab CI'],
  },
  {
    title: 'Databases',
    icon: Storage,
    color: '#d97706',
    skills: ['PostgreSQL', 'DynamoDB', 'BigQuery', 'Firestore', 'Redis'],
  },
];

const achievements = [
  {
    icon: Groups,
    title: 'Team Leadership',
    description: 'Led diverse development teams to deliver high-quality, customer-focused products on schedule.',
  },
  {
    icon: Rocket,
    title: 'Scalable Architecture',
    description: 'Designed and implemented scalable architectures for complex systems, ensuring reliability.',
  },
  {
    icon: Cloud,
    title: 'Cloud Migration',
    description: 'Spearheaded cloud migration projects, optimizing performance and reducing costs.',
  },
  {
    icon: School,
    title: 'Mentorship',
    description: 'Mentored and coached team members, fostering professional growth and technical excellence.',
  },
];

const techStack = [
  { name: 'Node.js', level: 95 },
  { name: 'React.js', level: 92 },
  { name: 'TypeScript', level: 90 },
  { name: 'AWS', level: 88 },
  { name: 'Ruby on Rails', level: 85 },
  { name: 'PostgreSQL', level: 87 },
];

export default function AboutPardeepPage() {
  const [showEmail, setShowEmail] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Trigger animations on mount
  useState(() => {
    setMounted(true);
  });

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f8fafc' }}>
      <Header user={null} />

      {/* Hero Section with Gradient */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #7c3aed 100%)',
          color: 'white',
          py: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            opacity: 0.5,
          },
        }}
      >
        <Container maxWidth="lg">
          <Fade in timeout={1000}>
            <Grid container spacing={4} alignItems="center">
              <Grid size={{ xs: 12, md: 4 }} sx={{ textAlign: 'center' }}>
                <Box
                  sx={{
                    position: 'relative',
                    display: 'inline-block',
                    '@keyframes pulse': {
                      '0%': { boxShadow: '0 0 0 0 rgba(255,255,255,0.4)' },
                      '70%': { boxShadow: '0 0 0 20px rgba(255,255,255,0)' },
                      '100%': { boxShadow: '0 0 0 0 rgba(255,255,255,0)' },
                    },
                  }}
                >
                  <Avatar
                    sx={{
                      width: { xs: 150, md: 200 },
                      height: { xs: 150, md: 200 },
                      fontSize: '4rem',
                      bgcolor: 'rgba(255,255,255,0.2)',
                      border: '4px solid rgba(255,255,255,0.3)',
                      animation: 'pulse 2s infinite',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    PD
                  </Avatar>
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 10,
                      right: 10,
                      bgcolor: '#22c55e',
                      borderRadius: '50%',
                      width: 24,
                      height: 24,
                      border: '3px solid white',
                    }}
                  />
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                <Typography
                  variant="overline"
                  sx={{
                    color: 'rgba(255,255,255,0.8)',
                    letterSpacing: 3,
                    mb: 1,
                    display: 'block',
                  }}
                >
                  Meet the Developer
                </Typography>
                <Typography
                  variant="h1"
                  sx={{
                    fontSize: { xs: '2.5rem', md: '3.5rem' },
                    fontWeight: 800,
                    mb: 2,
                    '@keyframes slideIn': {
                      from: { opacity: 0, transform: 'translateX(-30px)' },
                      to: { opacity: 1, transform: 'translateX(0)' },
                    },
                    animation: 'slideIn 0.8s ease-out',
                  }}
                >
                  Pardeep Dhingra
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    opacity: 0.9,
                    mb: 3,
                    fontWeight: 400,
                    '@keyframes slideIn': {
                      from: { opacity: 0, transform: 'translateX(-30px)' },
                      to: { opacity: 1, transform: 'translateX(0)' },
                    },
                    animation: 'slideIn 0.8s ease-out 0.2s both',
                  }}
                >
                  Team Lead & Senior Software Engineer
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    gap: 2,
                    flexWrap: 'wrap',
                    mb: 3,
                    '@keyframes fadeUp': {
                      from: { opacity: 0, transform: 'translateY(20px)' },
                      to: { opacity: 1, transform: 'translateY(0)' },
                    },
                    animation: 'fadeUp 0.8s ease-out 0.4s both',
                  }}
                >
                  <Chip
                    label="14+ Years Experience"
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      fontWeight: 600,
                      backdropFilter: 'blur(10px)',
                    }}
                  />
                  <Chip
                    label="Full Stack Developer"
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      fontWeight: 600,
                      backdropFilter: 'blur(10px)',
                    }}
                  />
                  <Chip
                    label="Cloud Expert"
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      fontWeight: 600,
                      backdropFilter: 'blur(10px)',
                    }}
                  />
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    gap: 2,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    '@keyframes fadeUp': {
                      from: { opacity: 0, transform: 'translateY(20px)' },
                      to: { opacity: 1, transform: 'translateY(0)' },
                    },
                    animation: 'fadeUp 0.8s ease-out 0.6s both',
                  }}
                >
                  <Tooltip title="LinkedIn Profile">
                    <IconButton
                      component="a"
                      href="https://www.linkedin.com/in/pardeep-dhingra/"
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        '&:hover': {
                          bgcolor: '#0077b5',
                          transform: 'scale(1.1)',
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <LinkedIn />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Medium Blog">
                    <IconButton
                      component="a"
                      href="https://medium.com/@pardeepdhingra.01"
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        '&:hover': {
                          bgcolor: '#000',
                          transform: 'scale(1.1)',
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <Article />
                    </IconButton>
                  </Tooltip>
                  <Button
                    variant="contained"
                    startIcon={<Email />}
                    onClick={() => setShowEmail(!showEmail)}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      backdropFilter: 'blur(10px)',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.3)',
                      },
                    }}
                  >
                    {showEmail ? 'pardeep@galasar.com' : 'Show Email'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Fade>
        </Container>
      </Box>

      {/* About Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Grow in timeout={800}>
          <Card
            sx={{
              mb: 6,
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: 4,
              boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
              overflow: 'visible',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -3,
                left: -3,
                right: -3,
                bottom: -3,
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                borderRadius: 5,
                zIndex: -1,
                opacity: 0,
                transition: 'opacity 0.3s ease',
              },
              '&:hover::before': {
                opacity: 1,
              },
            }}
          >
            <CardContent sx={{ p: { xs: 3, md: 5 } }}>
              <Typography
                variant="h4"
                fontWeight={700}
                gutterBottom
                sx={{
                  background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                About Me
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
                I am an experienced Team Lead and Software Engineer with over{' '}
                <strong>14 years of experience</strong> in designing, developing, and delivering scalable
                and efficient software solutions. My expertise spans{' '}
                <strong>Node.js, React.js, and Ruby on Rails</strong>, combined with extensive experience
                in cloud platforms like <strong>Google Cloud (GCP) and AWS</strong>.
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem', lineHeight: 1.8, mt: 2 }}>
                I excel at building high-performance applications, leading teams, and fostering innovation
                in fast-paced environments. URL Lens is one of my passion projects, combining my expertise
                in web technologies with practical tools for developers and SEO professionals.
              </Typography>
            </CardContent>
          </Card>
        </Grow>

        {/* Skills Section */}
        <Typography
          variant="h4"
          fontWeight={700}
          textAlign="center"
          gutterBottom
          sx={{ mb: 4 }}
        >
          Technical Expertise
        </Typography>

        <Grid container spacing={3} sx={{ mb: 8 }}>
          {skillCategories.map((category, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={category.title}>
              <Grow in timeout={600 + index * 200}>
                <Card
                  sx={{
                    height: '100%',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: `0 20px 40px ${category.color}30`,
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 3,
                        bgcolor: `${category.color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2,
                      }}
                    >
                      <category.icon sx={{ fontSize: 28, color: category.color }} />
                    </Box>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      {category.title}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {category.skills.map((skill) => (
                        <Chip
                          key={skill}
                          label={skill}
                          size="small"
                          sx={{
                            bgcolor: `${category.color}10`,
                            color: category.color,
                            fontWeight: 500,
                            fontSize: '0.75rem',
                          }}
                        />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grow>
            </Grid>
          ))}
        </Grid>

        {/* Proficiency Bars */}
        <Card sx={{ mb: 8, p: { xs: 3, md: 5 }, borderRadius: 4 }}>
          <Typography variant="h5" fontWeight={700} gutterBottom sx={{ mb: 4 }}>
            Core Proficiencies
          </Typography>
          <Grid container spacing={3}>
            {techStack.map((tech, index) => (
              <Grid size={{ xs: 12, sm: 6 }} key={tech.name}>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body1" fontWeight={600}>
                      {tech.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {tech.level}%
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      height: 8,
                      bgcolor: '#e2e8f0',
                      borderRadius: 4,
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        height: '100%',
                        width: `${tech.level}%`,
                        background: 'linear-gradient(90deg, #2563eb 0%, #7c3aed 100%)',
                        borderRadius: 4,
                        '@keyframes fillBar': {
                          from: { width: 0 },
                          to: { width: `${tech.level}%` },
                        },
                        animation: `fillBar 1s ease-out ${index * 0.1}s both`,
                      }}
                    />
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Card>

        {/* Achievements */}
        <Typography
          variant="h4"
          fontWeight={700}
          textAlign="center"
          gutterBottom
          sx={{ mb: 4 }}
        >
          Leadership & Achievements
        </Typography>

        <Grid container spacing={3} sx={{ mb: 8 }}>
          {achievements.map((achievement, index) => (
            <Grid size={{ xs: 12, sm: 6 }} key={achievement.title}>
              <Slide direction="up" in timeout={600 + index * 150}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.02)',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 3, display: 'flex', gap: 2 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        bgcolor: '#2563eb15',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <achievement.icon sx={{ color: '#2563eb' }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight={700} gutterBottom>
                        {achievement.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {achievement.description}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Slide>
            </Grid>
          ))}
        </Grid>

        {/* URL Lens Section */}
        <Card
          sx={{
            background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
            color: 'white',
            borderRadius: 4,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <CardContent sx={{ p: { xs: 4, md: 6 }, textAlign: 'center' }}>
            <EmojiEvents sx={{ fontSize: 48, mb: 2, opacity: 0.9 }} />
            <Typography variant="h4" fontWeight={700} gutterBottom>
              URL Lens - My Creation
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: 600, mx: 'auto', mb: 4 }}>
              URL Lens represents my vision of creating powerful, accessible tools for developers
              and SEO professionals. It combines years of experience in web technologies,
              cloud computing, and user experience design.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                component={Link}
                href="/features"
                variant="contained"
                endIcon={<ArrowForward />}
                sx={{
                  bgcolor: 'white',
                  color: '#2563eb',
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.9)',
                  },
                }}
              >
                Explore Features
              </Button>
              <Button
                component={Link}
                href="/dashboard"
                variant="outlined"
                sx={{
                  borderColor: 'white',
                  color: 'white',
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255,255,255,0.1)',
                  },
                }}
              >
                Try URL Lens
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 4,
          mt: 'auto',
          borderTop: '1px solid #e2e8f0',
          bgcolor: 'white',
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} URL Lens. Crafted with passion by Pardeep Dhingra.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
