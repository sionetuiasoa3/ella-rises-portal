import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, Trophy, DollarSign, TrendingUp, ArrowRight } from 'lucide-react';
import { adminParticipantsService, adminEventTemplatesService, adminMilestoneTypesService, adminDonationsService } from '@/services/admin';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    participants: 0,
    eventTemplates: 0,
    milestoneTypes: 0,
    totalDonations: 0,
    totalDonors: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [participants, templates, milestones, donationSummary] = await Promise.all([
          adminParticipantsService.getAll(),
          adminEventTemplatesService.getAll(),
          adminMilestoneTypesService.getAll(),
          adminDonationsService.getSummary(),
        ]);

        setStats({
          participants: participants.length,
          eventTemplates: templates.length,
          milestoneTypes: milestones.length,
          totalDonations: donationSummary.totalAmount,
          totalDonors: donationSummary.totalDonors,
        });
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, []);

  const statCards = [
    {
      title: 'Total Participants',
      value: stats.participants,
      icon: Users,
      href: '/admin/participants',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Event Templates',
      value: stats.eventTemplates,
      icon: Calendar,
      href: '/admin/event-templates',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Milestone Types',
      value: stats.milestoneTypes,
      icon: Trophy,
      href: '/admin/milestones',
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
    {
      title: 'Total Donations',
      value: `$${stats.totalDonations.toLocaleString()}`,
      icon: DollarSign,
      href: '/admin/donations',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of the Ella Rises platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} to={stat.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold mt-1">
                        {isLoading ? '...' : stat.value}
                      </p>
                    </div>
                    <div className={`p-3 rounded-full ${stat.bgColor}`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              to="/admin/participants"
              className="flex items-center justify-between p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            >
              <span className="font-medium">Manage Participants</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/admin/event-templates"
              className="flex items-center justify-between p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            >
              <span className="font-medium">Create Event Template</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/admin/milestones"
              className="flex items-center justify-between p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            >
              <span className="font-medium">Manage Milestone Titles</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/admin/donations"
              className="flex items-center justify-between p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            >
              <span className="font-medium">View Donations</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Donation Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Total Raised</span>
                <span className="font-bold text-lg">${stats.totalDonations.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Unique Donors</span>
                <span className="font-bold text-lg">{stats.totalDonors}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Average Donation</span>
                <span className="font-bold text-lg">
                  ${stats.totalDonors > 0 ? Math.round(stats.totalDonations / stats.totalDonors) : 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
