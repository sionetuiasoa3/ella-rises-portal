import React, { useEffect, useState } from 'react';
import { adminDonationsService, type Donation } from '@/services/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, DollarSign, Users, TrendingUp, Loader2, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, isAfter, isBefore, parseISO } from 'date-fns';

const AdminDonations: React.FC = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [filteredDonations, setFilteredDonations] = useState<Donation[]>([]);
  const [summary, setSummary] = useState({ totalAmount: 0, totalDonors: 0, avgDonation: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let filtered = donations;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.DonorName.toLowerCase().includes(query) ||
          d.DonorEmail.toLowerCase().includes(query) ||
          d.DonationNotes?.toLowerCase().includes(query)
      );
    }

    if (dateFrom) {
      const fromDate = parseISO(dateFrom);
      filtered = filtered.filter((d) => isAfter(parseISO(d.DonationDate), fromDate) || d.DonationDate.startsWith(dateFrom));
    }

    if (dateTo) {
      const toDate = parseISO(dateTo);
      filtered = filtered.filter((d) => isBefore(parseISO(d.DonationDate), toDate) || d.DonationDate.startsWith(dateTo));
    }

    setFilteredDonations(filtered);
  }, [searchQuery, dateFrom, dateTo, donations]);

  const loadData = async () => {
    try {
      const [donationsData, summaryData] = await Promise.all([
        adminDonationsService.getAll(),
        adminDonationsService.getSummary(),
      ]);
      setDonations(donationsData);
      setFilteredDonations(donationsData);
      setSummary(summaryData);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load donations', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
  };

  const filteredTotal = filteredDonations.reduce((sum, d) => sum + d.DonationAmount, 0);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Donation Management</h1>
        <p className="text-muted-foreground">Track and analyze donations</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Raised</p>
                <p className="text-2xl font-bold">${summary.totalAmount.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unique Donors</p>
                <p className="text-2xl font-bold">{summary.totalDonors}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Donation</p>
                <p className="text-2xl font-bold">${Math.round(summary.avgDonation).toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle>All Donations</CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search donor, email, notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Date Range:</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-40"
                  placeholder="From"
                />
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-40"
                  placeholder="To"
                />
                {(dateFrom || dateTo || searchQuery) && (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
            {filteredDonations.length !== donations.length && (
              <p className="text-sm text-muted-foreground">
                Showing {filteredDonations.length} of {donations.length} donations • Filtered total: ${filteredTotal.toLocaleString()}
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Donor</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDonations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No donations found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDonations.map((donation) => (
                      <TableRow key={donation.DonationID}>
                        <TableCell className="font-medium">
                          {donation.DonorName}
                          {donation.ParticipantID && (
                            <Badge variant="outline" className="ml-2">Participant</Badge>
                          )}
                        </TableCell>
                        <TableCell>{donation.DonorEmail}</TableCell>
                        <TableCell className="font-semibold text-green-600">
                          ${donation.DonationAmount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{donation.DonationFrequency}</Badge>
                        </TableCell>
                        <TableCell>{format(new Date(donation.DonationDate), 'MMM d, yyyy')}</TableCell>
                        <TableCell className="max-w-xs truncate text-muted-foreground">
                          {donation.DonationNotes || '—'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDonations;
