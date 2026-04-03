'use client'

import { useEffect, useState } from 'react'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { User, Unit, Vehicle } from '@/lib/types'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { Car, Home, Search, Plus, X, Users, SquarePen, Trash } from 'lucide-react'

interface UserWithDetails extends Omit<User, 'password_hash'> {
  unit?: Unit
  vehicles: Vehicle[]
}

export default function PeoplePage() {
  const { user: currentUser } = useAuth()
  const [units, setUnits] = useState<Unit[]>([])
  const [users, setUsers] = useState<UserWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isResidentModalOpen, setIsResidentModalOpen] = useState(false)
  const [isVehicleSheetOpen, setIsVehicleSheetOpen] = useState(false)
  const [selectedResident, setSelectedResident] = useState<UserWithDetails | null>(null)
  const [selectedUnitForModal, setSelectedUnitForModal] = useState<Unit | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { toast } = useToast()

  const [residentForm, setResidentForm] = useState({
    name: '',
    email: '',
    phone: '',
    resident_type: 'OWNER' as 'OWNER' | 'TENANT' | 'FAMILY',
  })

  const [vehicleForm, setVehicleForm] = useState({
    type: 'TWO_WHEELER' as 'TWO_WHEELER' | 'FOUR_WHEELER',
    sticker_number: '',
  })

  const isAdmin = currentUser?.role === 'ADMIN'

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const response = await fetch('/api/users')
      const data = await response.json()
      if (data.success) {
        setUnits(data.data.units || [])
        setUsers(data.data.users || [])
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function openAddResident(unit: Unit) {
    setSelectedUnitForModal(unit)
    setSelectedResident(null)
    setResidentForm({ name: '', email: '', phone: '', resident_type: 'OWNER' })
    setIsResidentModalOpen(true)
  }

  function openEditResident(resident: UserWithDetails) {
    setSelectedUnitForModal(null)
    setSelectedResident(resident)
    setResidentForm({
      name: resident.name,
      email: resident.email,
      phone: resident.phone || '',
      resident_type: resident.resident_type,
    })
    setIsResidentModalOpen(true)
  }

  function openAddVehicleSheet(resident: UserWithDetails) {
    setSelectedResident(resident)
    setVehicleForm({ type: 'TWO_WHEELER', sticker_number: '' })
    setIsVehicleSheetOpen(true)
  }

  function closeResidentModal() {
    setIsResidentModalOpen(false)
    setSelectedResident(null)
    setSelectedUnitForModal(null)
  }

  async function handleResidentSubmit(e: React.FormEvent) {
    e.preventDefault()

    setIsSubmitting(true)
    try {
      if (selectedResident) {
        const response = await fetch(`/api/users/${selectedResident.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: residentForm.name,
            phone: residentForm.phone,
            resident_type: residentForm.resident_type,
          }),
        })
        const data = await response.json()
        if (!data.success) {
          toast({ title: 'Error', description: data.error, variant: 'destructive' })
          return
        }
        toast({ title: 'Success', description: 'Resident updated' })
      } else if (selectedUnitForModal) {
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...residentForm,
            unit_id: selectedUnitForModal.id,
            status: 'APPROVED',
          }),
        })
        const data = await response.json()
        if (!data.success) {
          toast({ title: 'Error', description: data.error, variant: 'destructive' })
          return
        }
        toast({ title: 'Success', description: 'Resident added' })
      }
      closeResidentModal()
      fetchData()
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save resident', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteResident(id: string) {
    if (!confirm('Remove this resident?')) return
    try {
      const response = await fetch(`/api/users/${id}`, { method: 'DELETE' })
      const data = await response.json()
      if (!data.success) {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
        return
      }
      toast({ title: 'Success', description: 'Resident removed' })
      fetchData()
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to remove resident', variant: 'destructive' })
    }
  }

  async function handleVehicleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedResident) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedResident.id,
          unit_id: selectedResident.unit_id,
          type: vehicleForm.type,
          sticker_number: vehicleForm.sticker_number,
        }),
      })
      const data = await response.json()
      if (!data.success) {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
        return
      }
      toast({ title: 'Success', description: 'Vehicle added' })
      setIsVehicleSheetOpen(false)
      fetchData()
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add vehicle', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteVehicle(id: string) {
    if (!confirm('Delete this vehicle?')) return
    try {
      const response = await fetch(`/api/vehicles/${id}`, { method: 'DELETE' })
      const data = await response.json()
      if (!data.success) {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
        return
      }
      toast({ title: 'Success', description: 'Vehicle deleted' })
      fetchData()
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete vehicle', variant: 'destructive' })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    )
  }

  const filteredUnits = units.filter((unit) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    if (unit.unit_number.toLowerCase().includes(query)) return true
    if (unit.wing?.toLowerCase().includes(query)) return true
    const unitResidents = users.filter((u) => u.unit_id === unit.id)
    return unitResidents.some(r => 
      r.name.toLowerCase().includes(query) || 
      r.email.toLowerCase().includes(query)
    )
  })

  const getResidentBadge = (type: string) => {
    switch (type) {
      case 'OWNER': return <Badge className="bg-blue-500 text-white text-[10px]">Owner</Badge>
      case 'TENANT': return <Badge className="bg-green-500 text-white text-[10px]">Tenant</Badge>
      case 'FAMILY': return <Badge className="bg-gray-500 text-white text-[10px]">Family</Badge>
      default: return null
    }
  }

  const totalResidents = users.length
  const totalUnits = units.length
  const occupiedUnits = new Set(users.map(u => u.unit_id)).size

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-background border-b px-4 md:px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Residents</h1>
            <p className="text-sm md:text-base text-muted-foreground hidden md:block">
              {totalResidents} residents in {occupiedUnits}/{totalUnits} units
            </p>
          </div>
          {isAdmin && units.length > 0 && (
            <Button 
              size="sm"
              onClick={() => openAddResident(units[0])}
              className="self-start md:self-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="md:hidden">Add</span>
              <span className="hidden md:inline">Add Resident</span>
            </Button>
          )}
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by unit, name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted/50 border-0 md:border rounded-xl md:rounded-md h-10 md:h-9"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 md:gap-4 px-4 md:px-6 py-3 md:py-4 bg-muted/30">
        <div className="bg-background rounded-lg md:rounded-xl p-3 text-center shadow-sm">
          <div className="text-xl md:text-2xl font-bold text-blue-600">{totalUnits}</div>
          <div className="text-xs text-muted-foreground">Total Units</div>
        </div>
        <div className="bg-background rounded-lg md:rounded-xl p-3 text-center shadow-sm">
          <div className="text-xl md:text-2xl font-bold text-green-600">{occupiedUnits}</div>
          <div className="text-xs text-muted-foreground">Occupied</div>
        </div>
        <div className="bg-background rounded-lg md:rounded-xl p-3 text-center shadow-sm">
          <div className="text-xl md:text-2xl font-bold text-orange-600">{totalUnits - occupiedUnits}</div>
          <div className="text-xs text-muted-foreground">Vacant</div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-24 md:pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUnits.map((unit) => {
            const residents = users.filter((u) => u.unit_id === unit.id)
            return (
              <Card key={unit.id} className="overflow-hidden">
                <CardHeader className="pb-3 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Home className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{unit.unit_number}</CardTitle>
                        <p className="text-xs text-muted-foreground">{unit.wing} • Floor {unit.floor}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {residents.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-3">
                  {residents.length === 0 ? (
                    <div className="py-4 text-center">
                      <p className="text-sm text-muted-foreground mb-3">No residents</p>
                      {isAdmin && (
                        <Button variant="outline" size="sm" onClick={() => openAddResident(unit)}>
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {residents.map((resident) => (
                        <div key={resident.id} className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-medium">{resident.name.charAt(0)}</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-sm font-medium truncate">{resident.name}</span>
                                {getResidentBadge(resident.resident_type)}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">{resident.email}</p>
                              {resident.vehicles.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {resident.vehicles.map((vehicle) => (
                                    <span key={vehicle.id} className="inline-flex items-center gap-1 text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">
                                      <Car className="h-2.5 w-2.5" />
                                      {vehicle.sticker_number}
                                      {isAdmin && (
                                        <button onClick={() => handleDeleteVehicle(vehicle.id)} className="ml-0.5 hover:text-red-700">
                                          <X className="h-2.5 w-2.5" />
                                        </button>
                                      )}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          {isAdmin && (
                            <div className="flex items-center gap-0.5">
                              <Button 
                                variant="ghost" 
                                size="icon-sm" 
                                className="h-8 w-8"
                                onClick={() => openAddVehicleSheet(resident)}
                              >
                                <Car className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon-sm" 
                                className="h-8 w-8"
                                onClick={() => openEditResident(resident)}
                              >
                                <SquarePen className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon-sm" 
                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDeleteResident(resident.id)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredUnits.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No units found</p>
          </div>
        )}
      </div>

      {/* Desktop Dialog - Resident Form (hidden on mobile) */}
      <div className="hidden md:block">
        <Dialog open={isResidentModalOpen} onOpenChange={(open) => {
          if (!open) closeResidentModal()
        }}>
          <DialogContent className="sm:max-w-md md:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {selectedResident ? 'Edit Resident' : selectedUnitForModal ? `Add to ${selectedUnitForModal.unit_number}` : 'Add Resident'}
              </DialogTitle>
              <DialogDescription>
                {selectedResident 
                  ? 'Update resident information' 
                  : selectedUnitForModal 
                    ? 'Add a new resident to this unit'
                    : 'Fill in resident details'
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleResidentSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input 
                  value={residentForm.name} 
                  onChange={(e) => setResidentForm({ ...residentForm, name: e.target.value })} 
                  required 
                  className="h-10 md:h-11" 
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input 
                  type="email" 
                  value={residentForm.email} 
                  onChange={(e) => setResidentForm({ ...residentForm, email: e.target.value })} 
                  required 
                  disabled={!!selectedResident}
                  className="h-10 md:h-11" 
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input 
                  value={residentForm.phone} 
                  onChange={(e) => setResidentForm({ ...residentForm, phone: e.target.value })} 
                  className="h-10 md:h-11" 
                />
              </div>
              <div className="space-y-2">
                <Label>Resident Type</Label>
                <Select value={residentForm.resident_type} onValueChange={(v) => setResidentForm({ ...residentForm, resident_type: v as any })}>
                  <SelectTrigger className="h-10 md:h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OWNER">Owner</SelectItem>
                    <SelectItem value="TENANT">Tenant</SelectItem>
                    <SelectItem value="FAMILY">Family</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={closeResidentModal}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Spinner className="h-4 w-4" /> : selectedResident ? 'Update' : 'Add Resident'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Mobile Sheet - Resident Form (hidden on desktop) */}
      <div className="md:hidden">
        <Sheet open={isResidentModalOpen} onOpenChange={(open) => {
          if (!open) closeResidentModal()
        }}>
          <SheetContent side="bottom" className="rounded-t-2xl px-0 pb-6">
            <SheetHeader className="px-4 pb-4 border-b">
              <SheetTitle className="text-xl">
                {selectedResident ? 'Edit Resident' : selectedUnitForModal ? `Add to ${selectedUnitForModal.unit_number}` : 'Add Resident'}
              </SheetTitle>
              <SheetDescription>
                {selectedResident 
                  ? 'Update resident information' 
                  : selectedUnitForModal 
                    ? 'Add a new resident to this unit'
                    : 'Fill in resident details'
                }
              </SheetDescription>
            </SheetHeader>
            
            <form onSubmit={handleResidentSubmit} className="px-4 py-5 space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Name</Label>
                <Input 
                  value={residentForm.name} 
                  onChange={(e) => setResidentForm({ ...residentForm, name: e.target.value })} 
                  required 
                  className="h-12 text-base"
                  placeholder="Enter name"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Email</Label>
                <Input 
                  type="email" 
                  value={residentForm.email} 
                  onChange={(e) => setResidentForm({ ...residentForm, email: e.target.value })} 
                  required 
                  disabled={!!selectedResident}
                  className="h-12 text-base"
                  placeholder="Enter email"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Phone</Label>
                <Input 
                  value={residentForm.phone} 
                  onChange={(e) => setResidentForm({ ...residentForm, phone: e.target.value })} 
                  className="h-12 text-base"
                  placeholder="Enter phone (optional)"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Resident Type</Label>
                <Select value={residentForm.resident_type} onValueChange={(v) => setResidentForm({ ...residentForm, resident_type: v as any })}>
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OWNER">Owner</SelectItem>
                    <SelectItem value="TENANT">Tenant</SelectItem>
                    <SelectItem value="FAMILY">Family</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={closeResidentModal}
                  className="flex-1 h-14 text-base font-medium"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1 h-14 text-base font-medium">
                  {isSubmitting ? <Spinner className="h-5 w-5" /> : selectedResident ? 'Update' : 'Add'}
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      {/* Vehicle Sheet - Mobile optimized */}
      <div className="md:hidden">
        <Sheet open={isVehicleSheetOpen} onOpenChange={setIsVehicleSheetOpen}>
          <SheetContent side="bottom" className="rounded-t-2xl px-0 pb-6">
            <SheetHeader className="px-4 pb-4 border-b">
              <SheetTitle className="text-xl">Add Vehicle</SheetTitle>
              <SheetDescription>For {selectedResident?.name}</SheetDescription>
            </SheetHeader>
            <form onSubmit={handleVehicleSubmit} className="px-4 py-5 space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Vehicle Type</Label>
                <Select value={vehicleForm.type} onValueChange={(v) => setVehicleForm({ ...vehicleForm, type: v as any })}>
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TWO_WHEELER">Two Wheeler</SelectItem>
                    <SelectItem value="FOUR_WHEELER">Four Wheeler</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Sticker Number</Label>
                <Input 
                  value={vehicleForm.sticker_number} 
                  onChange={(e) => setVehicleForm({ ...vehicleForm, sticker_number: e.target.value })} 
                  required 
                  placeholder="e.g., VH-001" 
                  className="h-12 text-base"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsVehicleSheetOpen(false)} className="flex-1 h-14 text-base font-medium">Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1 h-14 text-base font-medium">
                  {isSubmitting ? <Spinner className="h-5 w-5" /> : 'Add'}
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      {/* Vehicle Sheet - Desktop */}
      <div className="hidden md:block">
        <Sheet open={isVehicleSheetOpen} onOpenChange={setIsVehicleSheetOpen}>
          <SheetContent side="bottom" className="rounded-t-xl">
            <SheetHeader>
              <SheetTitle>Add Vehicle</SheetTitle>
              <SheetDescription>For {selectedResident?.name}</SheetDescription>
            </SheetHeader>
            <form onSubmit={handleVehicleSubmit} className="space-y-4 px-4 py-4">
              <div className="space-y-2">
                <Label>Vehicle Type</Label>
                <Select value={vehicleForm.type} onValueChange={(v) => setVehicleForm({ ...vehicleForm, type: v as any })}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TWO_WHEELER">Two Wheeler</SelectItem>
                    <SelectItem value="FOUR_WHEELER">Four Wheeler</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sticker Number</Label>
                <Input 
                  value={vehicleForm.sticker_number} 
                  onChange={(e) => setVehicleForm({ ...vehicleForm, sticker_number: e.target.value })} 
                  required 
                  placeholder="e.g., VH-001" 
                  className="h-12" 
                />
              </div>
              <SheetFooter className="mt-4">
                <Button type="button" variant="outline" onClick={() => setIsVehicleSheetOpen(false)} className="flex-1 h-12">Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1 h-12">
                  {isSubmitting ? <Spinner className="h-4 w-4" /> : 'Add'}
                </Button>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
