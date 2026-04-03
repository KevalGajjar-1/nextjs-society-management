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
import { Vehicle, User, Unit } from '@/lib/types'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { Car, Search, Plus, Pencil, Trash, User as UserIcon, X } from 'lucide-react'

interface VehicleWithDetails extends Vehicle {
  user?: User
  unit?: Unit
}

export default function VehiclesPage() {
  const { user: currentUser } = useAuth()
  const [vehicles, setVehicles] = useState<VehicleWithDetails[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleWithDetails | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { toast } = useToast()

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'COMMITTEE'

  const [vehicleForm, setVehicleForm] = useState({
    user_id: '',
    unit_id: '',
    type: 'TWO_WHEELER' as 'TWO_WHEELER' | 'FOUR_WHEELER',
    sticker_number: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [vehiclesRes, usersRes, unitsRes] = await Promise.all([
        fetch('/api/vehicles'),
        fetch('/api/users'),
        fetch('/api/units'),
      ])
      const [vehiclesData, usersData, unitsData] = await Promise.all([
        vehiclesRes.json(),
        usersRes.json(),
        unitsRes.json(),
      ])
      
      const vehiclesList = vehiclesData.data || []
      const usersList = usersData.data?.users || []
      const unitsList = unitsData.data || []

      const vehiclesWithDetails = vehiclesList.map((v: Vehicle) => ({
        ...v,
        user: usersList.find((u: any) => u.id === v.user_id),
        unit: unitsList.find((u: any) => u.id === v.unit_id),
      }))

      setVehicles(vehiclesWithDetails)
      setUsers(usersList)
      setUnits(unitsList)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function openAddVehicle() {
    setSelectedVehicle(null)
    setVehicleForm({ user_id: '', unit_id: '', type: 'TWO_WHEELER', sticker_number: '' })
    setIsSheetOpen(true)
  }

  function openEditVehicle(vehicle: VehicleWithDetails) {
    setSelectedVehicle(vehicle)
    setVehicleForm({
      user_id: vehicle.user_id,
      unit_id: vehicle.unit_id || '',
      type: vehicle.type,
      sticker_number: vehicle.sticker_number,
    })
    setIsSheetOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const url = selectedVehicle ? `/api/vehicles/${selectedVehicle.id}` : '/api/vehicles'
      const method = selectedVehicle ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...vehicleForm,
          unit_id: vehicleForm.unit_id || null,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
        return
      }

      toast({ title: 'Success', description: selectedVehicle ? 'Vehicle updated' : 'Vehicle added' })
      setIsSheetOpen(false)
      fetchData()
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save vehicle', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
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

  const filteredVehicles = vehicles.filter((vehicle) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      vehicle.sticker_number.toLowerCase().includes(query) ||
      vehicle.user?.name.toLowerCase().includes(query) ||
      vehicle.unit?.unit_number.toLowerCase().includes(query)
    )
  })

  const twoWheelers = filteredVehicles.filter((v) => v.type === 'TWO_WHEELER')
  const fourWheelers = filteredVehicles.filter((v) => v.type === 'FOUR_WHEELER')

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-background border-b px-4 md:px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Vehicles</h1>
            <p className="text-sm md:text-base text-muted-foreground hidden md:block">
              {vehicles.length} vehicles registered
            </p>
          </div>
          {isAdmin && (
            <Button size="sm" onClick={openAddVehicle}>
              <Plus className="h-4 w-4 mr-2" />
              <span className="md:hidden">Add</span>
              <span className="hidden md:inline">Add Vehicle</span>
            </Button>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by sticker, name or unit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted/50 border-0 md:border rounded-xl md:rounded-md h-10 md:h-9"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 md:gap-4 px-4 md:px-6 py-3 md:py-4 bg-muted/30">
        <div className="bg-background rounded-lg md:rounded-xl p-3 text-center shadow-sm">
          <div className="text-xl md:text-2xl font-bold text-orange-600">{vehicles.length}</div>
          <div className="text-xs text-muted-foreground">Total</div>
        </div>
        <div className="bg-background rounded-lg md:rounded-xl p-3 text-center shadow-sm">
          <div className="text-xl md:text-2xl font-bold text-blue-600">{twoWheelers.length}</div>
          <div className="text-xs text-muted-foreground">2 Wheelers</div>
        </div>
        <div className="bg-background rounded-lg md:rounded-xl p-3 text-center shadow-sm">
          <div className="text-xl md:text-2xl font-bold text-purple-600">{fourWheelers.length}</div>
          <div className="text-xs text-muted-foreground">4 Wheelers</div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-24 md:pb-6">
        {filteredVehicles.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Car className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No vehicles found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredVehicles.map((vehicle) => (
              <Card key={vehicle.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${vehicle.type === 'TWO_WHEELER' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                        <Car className={`h-5 w-5 ${vehicle.type === 'TWO_WHEELER' ? 'text-blue-600' : 'text-purple-600'}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{vehicle.sticker_number}</span>
                          <Badge variant="secondary" className="text-xs">
                            {vehicle.type === 'TWO_WHEELER' ? '2W' : '4W'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {vehicle.user && (
                            <span className="flex items-center gap-1">
                              <UserIcon className="h-3 w-3" />
                              {vehicle.user.name}
                            </span>
                          )}
                          {vehicle.unit && (
                            <>
                              <span>•</span>
                              <span>{vehicle.unit.unit_number}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon-sm" className="h-8 w-8" onClick={() => openEditVehicle(vehicle)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(vehicle.id)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Dialog */}
      <div className="hidden md:block">
        <Dialog open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedVehicle ? 'Edit Vehicle' : 'Add Vehicle'}</DialogTitle>
              <DialogDescription>
                {selectedVehicle ? 'Update vehicle details' : 'Register a new vehicle'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Owner</Label>
                <Select value={vehicleForm.user_id} onValueChange={(v) => setVehicleForm({ ...vehicleForm, user_id: v })}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select value={vehicleForm.unit_id} onValueChange={(v) => setVehicleForm({ ...vehicleForm, unit_id: v })}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>{unit.unit_number}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Vehicle Type</Label>
                <Select value={vehicleForm.type} onValueChange={(v) => setVehicleForm({ ...vehicleForm, type: v as any })}>
                  <SelectTrigger className="h-10">
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
                <Input value={vehicleForm.sticker_number} onChange={(e) => setVehicleForm({ ...vehicleForm, sticker_number: e.target.value })} required placeholder="e.g., VH-001" className="h-10" />
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsSheetOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Spinner className="h-4 w-4" /> : selectedVehicle ? 'Update' : 'Add'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Mobile Sheet */}
      <div className="md:hidden">
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent side="bottom" className="rounded-t-2xl px-0 pb-6">
            <SheetHeader className="px-4 pb-4 border-b">
              <SheetTitle className="text-xl">{selectedVehicle ? 'Edit Vehicle' : 'Add Vehicle'}</SheetTitle>
              <SheetDescription>
                {selectedVehicle ? 'Update vehicle details' : 'Register a new vehicle'}
              </SheetDescription>
            </SheetHeader>
            <form onSubmit={handleSubmit} className="px-4 py-5 space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Owner</Label>
                <Select value={vehicleForm.user_id} onValueChange={(v) => setVehicleForm({ ...vehicleForm, user_id: v })}>
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Select owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Unit</Label>
                <Select value={vehicleForm.unit_id} onValueChange={(v) => setVehicleForm({ ...vehicleForm, unit_id: v })}>
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>{unit.unit_number}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                <Input value={vehicleForm.sticker_number} onChange={(e) => setVehicleForm({ ...vehicleForm, sticker_number: e.target.value })} required placeholder="e.g., VH-001" className="h-12 text-base" />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsSheetOpen(false)} className="flex-1 h-14 text-base font-medium">Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1 h-14 text-base font-medium">
                  {isSubmitting ? <Spinner className="h-5 w-5" /> : selectedVehicle ? 'Update' : 'Add'}
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
