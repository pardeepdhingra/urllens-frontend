'use client';

// ============================================================================
// URL Lens - SEO Analysis Panel Component
// Displays SEO/AEO/GEO/LLMO scores with recommendations
// ============================================================================

import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  Divider,
  Alert,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  ExpandMore,
  CheckCircle,
  Error as ErrorIcon,
  Warning,
  Info,
  TrendingUp,
  Search,
  QuestionAnswer,
  SmartToy,
  Psychology,
  ContentCopy,
} from '@mui/icons-material';
import type {
  SEOAnalysisResult,
  SEOScore,
  AEOScore,
  GEOScore,
  LLMOScore,
  SEORecommendation,
  ScoreCategory,
} from '@/types/seo';

interface SEOAnalysisPanelProps {
  analysis: SEOAnalysisResult;
}

// Score card component for each dimension
interface ScoreCardProps {
  title: string;
  shortTitle: string;
  description: string;
  score: number;
  grade: string;
  icon: React.ReactNode;
  categories: Record<string, ScoreCategory>;
  passedChecks: string[];
}

function ScoreCard({
  title,
  shortTitle,
  description,
  score,
  grade,
  icon,
  categories,
  passedChecks,
}: ScoreCardProps) {
  const [expanded, setExpanded] = useState(false);

  const getScoreColor = (s: number) => {
    if (s >= 80) return 'success';
    if (s >= 60) return 'info';
    if (s >= 40) return 'warning';
    return 'error';
  };

  const getScoreEmoji = (s: number) => {
    if (s >= 80) return '🟢';
    if (s >= 60) return '🟡';
    if (s >= 40) return '🟠';
    return '🔴';
  };

  const color = getScoreColor(score);

  return (
    <Accordion
      expanded={expanded}
      onChange={() => setExpanded(!expanded)}
      sx={{
        mb: 2,
        border: '1px solid',
        borderColor: `${color}.main`,
        borderRadius: '8px !important',
        '&:before': { display: 'none' },
        overflow: 'hidden',
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMore />}
        sx={{
          bgcolor: `${color}.50`,
          '&:hover': { bgcolor: `${color}.100` },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
          <Box sx={{ color: `${color}.main` }}>{icon}</Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              {getScoreEmoji(score)} {shortTitle}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {description}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right', minWidth: 80 }}>
            <Typography variant="h5" fontWeight="bold" color={`${color}.main`}>
              {score}
            </Typography>
            <Chip label={grade} size="small" color={color} />
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 2 }}>
        {/* Category breakdown */}
        <Typography variant="subtitle2" gutterBottom fontWeight="bold">
          Score Breakdown
        </Typography>
        {Object.entries(categories).map(([key, category]) => (
          <Box key={key} sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2">{category.name}</Typography>
              <Typography variant="body2" fontWeight="bold">
                {category.score}/{category.maxScore}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={(category.score / category.maxScore) * 100}
              color={getScoreColor((category.score / category.maxScore) * 100)}
              sx={{ height: 8, borderRadius: 4 }}
            />
            {category.issues.length > 0 && (
              <List dense sx={{ mt: 1 }}>
                {category.issues.map((issue) => (
                  <ListItem key={issue.id} sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      {issue.priority === 'critical' ? (
                        <ErrorIcon color="error" fontSize="small" />
                      ) : issue.priority === 'high' ? (
                        <Warning color="warning" fontSize="small" />
                      ) : (
                        <Info color="info" fontSize="small" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2">{issue.description}</Typography>
                          <Chip
                            label={`+${issue.points} pts`}
                            size="small"
                            color={getScoreColor(100 - issue.points * 5)}
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        </Box>
                      }
                      secondary={issue.howToFix}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        ))}

        {/* Passed checks */}
        {passedChecks.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom fontWeight="bold" color="success.main">
              ✓ Passed Checks ({passedChecks.length})
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {passedChecks.map((check, idx) => (
                <Chip
                  key={idx}
                  icon={<CheckCircle fontSize="small" />}
                  label={check}
                  size="small"
                  color="success"
                  variant="outlined"
                />
              ))}
            </Box>
          </>
        )}
      </AccordionDetails>
    </Accordion>
  );
}

// Priority recommendations component
function PriorityRecommendations({ recommendations }: { recommendations: SEORecommendation[] }) {
  const [copied, setCopied] = useState<string | null>(null);

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <ErrorIcon color="error" />;
      case 'high':
        return <Warning color="warning" />;
      case 'medium':
        return <Info color="info" />;
      default:
        return <CheckCircle color="success" />;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'critical':
        return { label: 'Critical', color: 'error' as const };
      case 'high':
        return { label: 'High', color: 'warning' as const };
      case 'medium':
        return { label: 'Medium', color: 'info' as const };
      default:
        return { label: 'Low', color: 'success' as const };
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'seo':
        return 'SEO';
      case 'aeo':
        return 'AEO';
      case 'geo':
        return 'GEO';
      case 'llmo':
        return 'LLMO';
      default:
        return category.toUpperCase();
    }
  };

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // Show top 10 recommendations
  const topRecommendations = recommendations.slice(0, 10);

  if (topRecommendations.length === 0) {
    return (
      <Alert severity="success" sx={{ mt: 2 }}>
        Excellent! No major issues found. Your page is well optimized.
      </Alert>
    );
  }

  return (
    <Card sx={{ mt: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrendingUp color="primary" />
          Priority Recommendations
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Fix these issues to improve your scores. Sorted by impact.
        </Typography>

        <List>
          {topRecommendations.map((rec, idx) => {
            const priority = getPriorityLabel(rec.priority);
            return (
              <ListItem
                key={rec.id}
                sx={{
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  bgcolor: idx % 2 === 0 ? 'grey.50' : 'white',
                  borderRadius: 1,
                  mb: 1,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1, mb: 1 }}>
                  {getPriorityIcon(rec.priority)}
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ flex: 1 }}>
                    {rec.title}
                  </Typography>
                  <Chip label={priority.label} size="small" color={priority.color} />
                  <Chip label={getCategoryLabel(rec.category)} size="small" variant="outlined" />
                  <Chip label={`+${rec.pointsGain} pts`} size="small" color="primary" />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {rec.description}
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mt: 1,
                    p: 1,
                    bgcolor: 'grey.100',
                    borderRadius: 1,
                    width: '100%',
                  }}
                >
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    💡 <strong>How to fix:</strong> {rec.howToFix}
                  </Typography>
                  <Tooltip title={copied === rec.id ? 'Copied!' : 'Copy fix suggestion'}>
                    <IconButton
                      size="small"
                      onClick={() => handleCopy(rec.howToFix, rec.id)}
                      color={copied === rec.id ? 'success' : 'default'}
                    >
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </ListItem>
            );
          })}
        </List>

        {recommendations.length > 10 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
            + {recommendations.length - 10} more recommendations available
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export default function SEOAnalysisPanel({ analysis }: SEOAnalysisPanelProps) {
  // Sort scores by value (lowest first for attention)
  const scores = [
    { key: 'seo', data: analysis.seo, title: 'SEO', shortTitle: 'SEO', desc: 'Search Engine Optimization', icon: <Search /> },
    { key: 'aeo', data: analysis.aeo, title: 'AEO', shortTitle: 'AEO', desc: 'Answer Engine Optimization', icon: <QuestionAnswer /> },
    { key: 'geo', data: analysis.geo, title: 'GEO', shortTitle: 'GEO', desc: 'Generative Engine Optimization', icon: <SmartToy /> },
    { key: 'llmo', data: analysis.llmo, title: 'LLMO', shortTitle: 'LLMO', desc: 'LLM Optimization', icon: <Psychology /> },
  ].sort((a, b) => a.data.score - b.data.score);

  return (
    <Box>
      {/* Score Overview Cards */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {scores.map(({ key, data, shortTitle }) => {
          const getColor = (s: number) => {
            if (s >= 80) return 'success';
            if (s >= 60) return 'info';
            if (s >= 40) return 'warning';
            return 'error';
          };
          return (
            <Card
              key={key}
              sx={{
                flex: '1 1 120px',
                minWidth: 120,
                textAlign: 'center',
                border: '2px solid',
                borderColor: `${getColor(data.score)}.main`,
              }}
            >
              <CardContent sx={{ py: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  {shortTitle}
                </Typography>
                <Typography variant="h4" fontWeight="bold" color={`${getColor(data.score)}.main`}>
                  {data.score}
                </Typography>
                <Chip label={data.grade} size="small" color={getColor(data.score)} />
              </CardContent>
            </Card>
          );
        })}
      </Box>

      {/* Detailed Score Cards (sorted by score, lowest first) */}
      <Typography variant="h6" gutterBottom>
        Detailed Analysis
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Expand each section to see specific issues and how to fix them.
      </Typography>

      {scores.map(({ key, data, title, shortTitle, desc, icon }) => (
        <ScoreCard
          key={key}
          title={title}
          shortTitle={shortTitle}
          description={desc}
          score={data.score}
          grade={data.grade}
          icon={icon}
          categories={data.categories as unknown as Record<string, ScoreCategory>}
          passedChecks={data.passedChecks}
        />
      ))}

      {/* Priority Recommendations */}
      <PriorityRecommendations recommendations={analysis.recommendations} />

      {/* Analysis metadata */}
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'right' }}>
        Analysis completed in {analysis.analysisDurationMs}ms • Version {analysis.analysisVersion}
      </Typography>
    </Box>
  );
}
