'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Field, FieldLabel } from '@/components/ui/field'
import { Notice } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { Textarea } from '@/components/ui/textarea'

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    fetchNotices()
  }, [])

  async function fetchNotices() {
    try {
      const response = await fetch('/api/notices')
      const data = await response.json()
      if (data.success) {
        setNotices(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch notices:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCreateNotice(e: React.FormEvent) {
    e.preventDefault()

    if (!title.trim()) {
      toast({
        title: 'Error',
        description: 'Title is required',
        variant: 'destructive',
      })
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch('/api/notices/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Notice created',
          description: 'Notice has been published',
        })
        setTitle('')
        setDescription('')
        fetchNotices()
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to create notice',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsCreating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 max-w-4xl mx-auto w-full">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Notices</h1>
        <p className="text-muted-foreground">Create and manage community notices</p>
      </div>

      {/* Create Notice Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Notice</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateNotice} className="space-y-4">
            <Field>
              <FieldLabel htmlFor="title">Title</FieldLabel>
              <Input
                id="title"
                placeholder="Notice title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isCreating}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <Textarea
                id="description"
                placeholder="Notice details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isCreating}
                rows={4}
              />
            </Field>

            <Button type="submit" disabled={isCreating}>
              {isCreating ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Creating...
                </>
              ) : (
                'Create Notice'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Notices List */}
      <Card>
        <CardHeader>
          <CardTitle>Published Notices ({notices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {notices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notices yet</p>
          ) : (
            <div className="space-y-4">
              {notices.map((notice) => (
                <div
                  key={notice.id}
                  className="border-l-2 border-primary pl-4 py-2"
                >
                  <h3 className="font-medium">{notice.title}</h3>
                  {notice.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {notice.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(notice.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
