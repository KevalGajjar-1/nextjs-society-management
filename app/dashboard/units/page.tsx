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
import { Unit, User } from '@/lib/types'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { Building2, Home, Search, Plus, Pencil, Trash, Users } from 'lucide-react'

interface UnitWithDetails extends Unit {
  residents?: User[]
  residentCount?: number
}

export default function UnitsPage() {
  const { user: currentUser } = useAuth()
  const [units, setUnits] = useState<UnitWithDetails[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState<UnitWithDetails | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { toast } = useToast()

  const isAdmin = currentUser?.role === 'ADMIN'

  const [unitForm, setUnitForm] = useState({
    unit_number: '',
    wing: '',
    floor: '',
    type: 'FLAT' as 'FLAT' | 'SHOP',
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [unitsRes, usersRes] = await Promise.all([
        fetch('/api/units'),
        fetch('/api/users'),
      ])
      const [unitsData, usersData] = await Promise.all([
        unitsRes.json(),
        usersRes.json(),
      ])
      
      const unitsList = unitsData.data || []
      const usersList = usersData.data?.users || []

      const unitsWithResidents = unitsList.map((unit: Unit) => ({
        ...unit,
        residentCount: usersList.filter((u: any) => u.unit_id === unit.id).length,
      }))

      setUnits(unitsWithResidents)
      setUsers(usersList)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function openAddUnit() {
    setSelectedUnit(null)
    setUnitForm({ unit_number: '', wing: '', floor: '', type: 'FLAT' })
    setIsSheetOpen(true)
  }

  function openEditUnit(unit: UnitWithDetails) {
    setSelectedUnit(unit)
    setUnitForm({
      unit_number: unit.unit_number,
      wing: unit.wing || '',
      floor: unit.floor?.toString() || '',
      type: unit.type,
    })
    setIsSheetOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const url = selectedUnit ? `/api/units/${selectedUnit.id}` : '/api/units'
      const method = selectedUnit ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...unitForm,
          floor: parseInt(unitForm.floor) || 0,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
        return
      }

      toast({ title: 'Success', description: selectedUnit ? 'Unit updated' : 'Unit created' })
      setIsSheetOpen(false)
      fetchData()
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save unit', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this unit?')) return

    try {
      const response = await fetch(`/api/units/${id}`, { method: 'DELETE' })
      const data = await response.json()

      if (!data.success) {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
        return
      }

      toast({ title: 'Success', description: 'Unit deleted' })
      fetchData()
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete unit', variant: 'destructive' })
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
    return (
      unit.unit_number.toLowerCase().includes(query) ||
      unit.wing?.toLowerCase().includes(query)
    )
  })

  const flats = filteredUnits.filter((u) => u.type === 'FLAT')
  const shops = filteredUnits.filter((u) => u.type === 'SHOP')
  const totalResidents = units.reduce((sum, u) => sum + (u.residentCount || 0), 0)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-background border-b px-4 md:px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Units</h1>
            <p className="text-sm md:text-base text-muted-foreground hidden md:block">
              {units.length} units • {totalResidents} residents
            </p>
          </div>
          {isAdmin && (
            <Button size="sm" onClick={openAddUnit}>
              <Plus className="h-4 w-4 mr-2" />
              <span className="md:hidden">Add</span>
              <span className="hidden md:inline">Add Unit</span>
            </Button>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search units..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted/50 border-0 md:border rounded-xl md:rounded-md h-10 md:h-9"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 md:gap-4 px-4 md:px-6 py-3 md:py-4 bg-muted/30">
        <div className="bg-background rounded-lg md:rounded-xl p-3 text-center shadow-sm">
          <div className="text-xl md:text-2xl font-bold text-blue-600">{flats.length}</div>
          <div className="text-xs text-muted-foreground">Flats</div>
        </div>
        <div className="bg-background rounded-lg md:rounded-xl p-3 text-center shadow-sm">
          <div className="text-xl md:text-2xl font-bold text-purple-600">{shops.length}</div>
          <div className="text-xs text-muted-foreground">Shops</div>
        </div>
        <div className="bg-background rounded-lg md:rounded-xl p-3 text-center shadow-sm">
          <div className="text-xl md:text-2xl font-bold text-green-600">{totalResidents}</div>
          <div className="text-xs text-muted-foreground">Residents</div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-24 md:pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUnits.map((unit) => (
            <Card key={unit.id} className="overflow-hidden">
              <CardHeader className="pb-3 bg-muted/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${unit.type === 'FLAT' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                      <Building2 className={`h-4 w-4 ${unit.type === 'FLAT' ? 'text-blue-600' : 'text-purple-600'}`} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{unit.unit_number}</CardTitle>
                      <p className="text-xs text-muted-foreground">{unit.wing} • Floor {unit.floor}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {unit.type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{unit.residentCount || 0} residents</span>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon-sm" className="h-8 w-8" onClick={() => openEditUnit(unit)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(unit.id)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredUnits.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No units found</p>
          </div>
        )}
      </div>

      {/* Desktop Dialog */}
      <div className="hidden md:block">
        <Dialog open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedUnit ? 'Edit Unit' : 'Add Unit'}</DialogTitle>
              <DialogDescription>
                {selectedUnit ? 'Update unit details' : 'Create a new unit'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Unit Number</Label>
                <Input value={unitForm.unit_number} onChange={(e) => setUnitForm({ ...unitForm, unit_number: e.target.value })} required className="h-10" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Wing</Label>
                  <Input value={unitForm.wing} onChange={(e) => setUnitForm({ ...unitForm, wing: e.target.value })} required placeholder="A, B, Ground" className="h-10" />
                </div>
                <div className="space-y-2">
                  <Label>Floor</Label>
                  <Input type="number" value={unitForm.floor} onChange={(e) => setUnitForm({ ...unitForm, floor: e.target.value })} required className="h-10" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={unitForm.type} onValueChange={(v) => setUnitForm({ ...unitForm, type: v as any })}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FLAT">Flat</SelectItem>
                    <SelectItem value="SHOP">Shop</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsSheetOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Spinner className="h-4 w-4" /> : selectedUnit ? 'Update' : 'Add'}
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
              <SheetTitle className="text-xl">{selectedUnit ? 'Edit Unit' : 'Add Unit'}</SheetTitle>
              <SheetDescription>
                {selectedUnit ? 'Update unit details' : 'Create a new unit'}
              </SheetDescription>
            </SheetHeader>
            <form onSubmit={handleSubmit} className="px-4 py-5 space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Unit Number</Label>
                <Input value={unitForm.unit_number} onChange={(e) => setUnitForm({ ...unitForm, unit_number: e.target.value })} required className="h-12 text-base" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Wing</Label>
                  <Input value={unitForm.wing} onChange={(e) => setUnitForm({ ...unitForm, wing: e.target.value })} required placeholder="A, B, Ground" className="h-12 text-base" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Floor</Label>
                  <Input type="number" value={unitForm.floor} onChange={(e) => setUnitForm({ ...unitForm, floor: e.target.value })} required className="h-12 text-base" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Type</Label>
                <Select value={unitForm.type} onValueChange={(v) => setUnitForm({ ...unitForm, type: v as any })}>
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FLAT">Flat</SelectItem>
                    <SelectItem value="SHOP">Shop</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsSheetOpen(false)} className="flex-1 h-14 text-base font-medium">Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1 h-14 text-base font-medium">
                  {isSubmitting ? <Spinner className="h-5 w-5" /> : selectedUnit ? 'Update' : 'Add'}
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
